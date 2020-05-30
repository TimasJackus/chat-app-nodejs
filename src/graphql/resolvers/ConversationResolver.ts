import {
  Resolver,
  Query,
  Authorized,
  Mutation,
  Args,
  Ctx,
  Arg,
  FieldResolver,
  Root,
} from "type-graphql";
import { Service } from "typedi";
import { Conversation, User } from "../../entities";
import { ConversationService, MessageService } from "../../services";
import { ChannelArgs } from "../inputs";
import { Context } from "../types";
import { Fields } from "../decorators";
import { Channel } from "../../entities/Channel";
import { onlyUnique } from "../helpers/onlyUnique";
import { GraphQLError } from "graphql";
import { Message } from "../../entities/Message";
import { PrivateMessage } from "../../entities/PrivateMessage";

@Service()
@Resolver(() => Conversation)
export class ConversationResolver {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService
  ) {}

  @Authorized()
  @Query(() => [Conversation])
  async getConversations(
    @Fields() fields: (keyof Conversation)[],
    @Ctx() context: Context
  ) {
    fields = fields.filter((field) => field !== "starred");
    const conversations = await this.conversationService.getAll(
      fields,
      context.user.id
    );
    return conversations;
  }

  @Authorized()
  @Query(() => [Channel])
  async getChannels(
    @Fields() fields: (keyof Channel)[],
    @Ctx() context: Context
  ) {
    fields = fields.filter((field) => field !== "starred");
    return await this.conversationService.getChannels(fields, context.user.id);
  }

  @Authorized()
  @Mutation(() => Conversation)
  async initConversation(
    @Arg("members", () => [String]) members: string[],
    @Ctx() context: Context
  ) {
    return await this.conversationService.createGroupChat(
      members.concat(context.user.id).filter(onlyUnique)
    );
  }

  @Authorized()
  @Mutation(() => Channel)
  async initChannel(
    @Args() { name, isPrivate }: ChannelArgs,
    @Arg("members", () => [String]) members: string[],
    @Ctx() context: Context
  ) {
    if (name.length <= 2) {
      throw new GraphQLError("Name should be at least 3 characters length");
    }
    return await this.conversationService.createChannel(
      members.concat(context.user.id).filter(onlyUnique),
      name,
      isPrivate
    );
  }

  @Authorized()
  @Mutation(() => Conversation)
  async addMembers(
    @Arg("id", () => String) id: string,
    @Arg("members", () => [String]) members: string[],
    @Ctx() context: Context
  ) {
    return await this.conversationService.addMembers(
      id,
      members,
      context.user.id
    );
  }

  @Authorized()
  @Mutation(() => Channel)
  async convertToChannel(
    @Arg("conversationId") conversationId: string,
    @Arg("name") name: string,
    @Ctx() context: Context
  ) {
    return this.conversationService.convertToChannel(
      conversationId,
      name,
      context.user.id
    );
  }

  @Authorized()
  @Mutation(() => Conversation)
  async leaveConversation(
    @Arg("id", () => String) id: string,
    @Ctx() context: Context
  ) {
    return await this.conversationService.leaveConversation(
      id,
      context.user.id
    );
  }

  @Authorized()
  @Mutation(() => Conversation)
  async toggleStar(
    @Arg("id", () => String) id: string,
    @Ctx() context: Context
  ) {
    return await this.conversationService.toggleStarred(id, context.user.id);
  }

  @FieldResolver(() => Boolean)
  starred(@Root() conversation: Conversation, @Ctx() context: Context) {
    if (!conversation.starredUsers) {
      return false;
    }
    return !!(conversation.starredUsers as User[]).find(
      (user: User) => user.id === context.user.id
    );
  }

  @FieldResolver(() => Number)
  async unreadCount(
    @Root() conversation: Conversation,
    @Ctx() context: Context
  ) {
    const messages = await this.messageService.getConversationMessages(
      conversation.id,
      context.user.id
    );

    return messages.filter((message) => {
      if (message.sender) {
        if (
          (message.sender as User).id &&
          (message.sender as User).id === context.user.id
        ) {
          return false;
        }
        if (message.sender === context.user.id) {
          return false;
        }
      }
      if (!message.viewedUsers) {
        return true;
      }
      return !(message.viewedUsers as User[]).find(
        (user: User) => user.id === context.user.id
      );
    }).length;
  }
}
