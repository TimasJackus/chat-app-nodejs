import { Service } from "typedi";
import { Conversation, User } from "../entities";
import { BaseService } from "./BaseService";
import { GraphQLError } from "graphql";
import { getConnection } from "typeorm";
import { Channel } from "../entities/Channel";
import { UserService } from "./UserService";
import { ConversationType } from "../entities/enums";

@Service()
export class ConversationService extends BaseService<Conversation> {
  constructor(private userService: UserService) {
    super();
  }

  async getConversation(id: string, userId: string): Promise<Conversation> {
    const conversation = await Conversation.findOne(id, {
      relations: ["members", "starredUsers"],
    });
    if (!conversation) {
      throw new GraphQLError("Conversation doesn't exist");
    }
    conversation.members = conversation.members as User[];
    const member = conversation.members.find((c) => c.id === userId);
    if (!member) {
      throw new GraphQLError("You are not a member of this conversation!");
    }
    return conversation;
  }

  async checkIfExistsAndHasUser(conversationId: string, userId: string) {
    const conversation = await Conversation.findOne(conversationId, {
      relations: ["members"],
    });
    if (!conversation) {
      throw new GraphQLError("Conversation doesn't exist");
    }
    const memberIds = (conversation.members as User[]).map(
      (member: User) => member.id
    );
    if (!memberIds.includes(userId)) {
      throw new GraphQLError("User is not a member of this conversation");
    }
  }

  async toggleStarred(conversationId: string, userId: string) {
    const conversation = await this.getConversation(conversationId, userId);
    conversation.starredUsers = conversation.starredUsers as User[];
    const exists = conversation.starredUsers.find(
      (user: User) => user.id === userId
    );
    if (exists) {
      conversation.starredUsers = conversation.starredUsers.filter(
        (user: User) => user.id !== userId
      );
      return conversation.save();
    }
    const starredUsers = await this.userService.getUsersByIds([userId]);
    conversation.starredUsers = conversation.starredUsers.concat(starredUsers);
    return await conversation.save();
  }

  async getAll(columns: string[], userId: string) {
    columns = this.adjustColumns(columns, "conversation");
    const hasMemberColumn = columns.find((column) => column.includes("member"));
    let conversations: any = await getConnection()
      .getRepository(Conversation)
      .createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.members", "members")
      .leftJoinAndSelect("conversation.starredUsers", "starredUsers")
      .where({ type: "Conversation" })
      .getMany();
    // Temp solution
    conversations = conversations.filter((c: any) =>
      c.members.map((m: any) => m.id).includes(userId)
    );
    return conversations;
  }

  async getChannels(columns: string[], userId: string) {
    columns = this.adjustColumns(columns, "conversation");
    const hasMemberColumn = columns.find((column) => column.includes("member"));
    let conversations: any = await getConnection()
      .getRepository(Channel)
      .createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.members", "members")
      .leftJoinAndSelect("conversation.starredUsers", "starredUsers")
      .getMany();
    // Temp solution
    conversations = conversations.filter((c: any) =>
      c.members.map((m: any) => m.id).includes(userId)
    );
    // await this.toggleStarred(conversations[0].id, userId);
    return conversations;
  }

  async getListenerIds(id: string) {
    const members = await getConnection()
      .createQueryBuilder()
      .from("conversation_members", "member")
      .select(["member.userId"])
      .where({ conversationId: id })
      .getRawMany();
    return members.map((member) => member.member_userId);
  }

  async createGroupChat(members: string[]) {
    const conversation = new Conversation();
    conversation.members = await this.userService.getUsersByIds(members);
    return await conversation.save();
  }

  async addMembers(id: string, members: string[], userId: string) {
    const conversation = await this.getConversation(id, userId);
    conversation.members = conversation.members as User[];
    const ids = conversation.members.map((c) => c.id);
    conversation.members = await this.userService.getUsersByIds(
      members.concat(ids)
    );
    return conversation.save();
  }

  async convertToChannel(id: string, name: string, userId: string) {
    if (await this.getChannelByName(name)) {
      throw new GraphQLError("Channel with this name already exists!");
    }
    const conversation = await this.getConversation(id, userId);
    const channel = conversation as Channel;
    channel.type = ConversationType.Channel;
    channel.name = name;
    channel.isPrivate = false;
    await Conversation.update(
      {
        id: conversation.id,
      },
      {
        type: ConversationType.Channel,
      }
    );
    return channel.save();
  }

  async getChannelByName(name: string) {
    return Channel.findOne({ name });
  }

  async createChannel(members: string[], name: string, isPrivate: boolean) {
    if (await this.getChannelByName(name)) {
      throw new GraphQLError("Channel with this name already exists!");
    }
    const channel = new Channel();
    channel.members = await this.userService.getUsersByIds(members);
    channel.name = name;
    channel.isPrivate = isPrivate;
    return channel.save();
  }

  async leaveConversation(id: string, userId: string) {
    const conversation = await this.getConversation(id, userId);
    conversation.members = conversation.members as User[];
    conversation.members = conversation.members.filter((c) => c.id !== userId);
    return await conversation.save();
  }

  async getChannelsSearch(by: string, userId: string) {
    const conversations = await Channel.createQueryBuilder()
      .where("Channel.name ILIKE :by", { by: `%${by}%` })
      .leftJoinAndSelect("Channel.members", "members")
      .leftJoinAndSelect("Channel.starredUsers", "starredUsers")
      .limit(5)
      .getMany();
    return conversations.filter((c: any) =>
      c.members.map((m: any) => m.id).includes(userId)
    );
  }

  async getConversationSearch(by: string, userId: string) {
    const conversations = await Conversation.find({
      join: {
        alias: "Conversation",
        innerJoin: { members: "Conversation.members" },
      },
      relations: ["members", "starredUsers"],
      where: (qb: any) => {
        qb.where({
          type: ConversationType.Group,
        }).andWhere("members.displayName ILIke :by", { by: `%${by}%` });
      },
      take: 5,
    });
    return conversations.filter((c: any) =>
      c.members.map((m: any) => m.id).includes(userId)
    );
  }
}
