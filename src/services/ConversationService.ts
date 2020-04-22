import { Service } from 'typedi';
import { Conversation, User } from '../entities';
import { BaseService } from './BaseService';
import { GraphQLError } from 'graphql';
import { getConnection } from 'typeorm';
import { Channel } from '../entities/Channel';
import { UserService } from './UserService';

@Service()
export class ConversationService extends BaseService<Conversation> {
    constructor(private userService: UserService) {
        super();
    }

    async getConversation(id: string, userId: string): Promise<Conversation> {
        const conversation = await Conversation.findOne(id, { relations: ['members' ]});
        if (!conversation) {
            throw new GraphQLError("Conversation doesn't exist");
        }
        conversation.members = conversation.members as User[];
        const member = conversation.members.find(c => c.id === userId);
        if (!member) {
            throw new GraphQLError("You are not a member of this conversation!");
        }
        return conversation;
    }

    async checkIfExists(id: string) {
        const conversation = await Conversation.findOne(id);
        if (!conversation) {
            throw new GraphQLError("Conversation doesn't exist");
        }
    }

    async getAll(columns: string[], userId: string) {
        columns = this.adjustColumns(columns, 'conversation');
        const hasMemberColumn = columns.find(column =>
            column.includes('member')
        );
        let conversations: any = await getConnection()
            .getRepository(Conversation)
            .createQueryBuilder('conversation');
        conversations = hasMemberColumn
            ? conversations.leftJoinAndSelect('conversation.members', 'members')
            : conversations;
        conversations = await conversations.select(columns).where({ type: "Conversation" }).getMany();
        // Temp solution
        conversations = conversations.filter((c: any) => c.members.map((m: any) => m.id).includes(userId));
        return conversations;
    }

    async getChannels(columns: string[], userId: string) {
        columns = this.adjustColumns(columns, 'conversation');
        const hasMemberColumn = columns.find(column =>
            column.includes('member')
        );
        let conversations: any = await getConnection()
            .getRepository(Channel)
            .createQueryBuilder('conversation');
        conversations = hasMemberColumn
            ? conversations.leftJoinAndSelect('conversation.members', 'members')
            : conversations;
        conversations = await conversations.select(columns).getMany();
        // Temp solution
        conversations = conversations.filter((c: any) => c.members.map((m: any) => m.id).includes(userId));
        return conversations;
    }

    async getListenerIds(id: string) {
        const members = await getConnection()
            .createQueryBuilder()
            .from('conversation_members', 'member')
            .select(['member.userId'])
            .where({ conversationId: id })
            .getRawMany();
        return members.map(member => member.member_userId);
    }

    async createGroupChat(members: string[]) {
        const conversation = new Conversation();
        conversation.members = await this.userService.getUsersByIds(members);
        return await conversation.save();
    }

    async addMembers(id: string, members: string[], userId: string) {
        const conversation = await this.getConversation(id, userId);
        conversation.members = conversation.members as User[];
        const ids = conversation.members.map(c => c.id);
        conversation.members = await this.userService.getUsersByIds(members.concat(ids));
        return conversation.save();
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
        conversation.members = conversation.members.filter(c => c.id !== userId);
        return await conversation.save();
    }
}
