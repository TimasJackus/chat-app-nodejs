import { Service } from 'typedi';
import { Conversation, User } from '../entities';
import { BaseService } from './BaseService';
import { GraphQLError } from 'graphql';
import { getConnection } from 'typeorm';

interface ConversationMembers {
    userId: string;
    conversationId: string;
}

@Service()
export class ConversationService extends BaseService<Conversation> {
    constructor() {
        super();
    }

    async checkIfExists(id: string) {
        const conversation = await Conversation.findOne(id);
        if (!conversation) {
            throw new GraphQLError("Conversation doesn't exist");
        }
    }

    async getAll(columns: string[]) {
        columns = this.adjustColumns(columns, 'conversation');
        const hasMemberColumn = columns.find(column =>
            column.includes('member')
        )
            ? true
            : false;
        let conversations: any = await getConnection()
            .getRepository(Conversation)
            .createQueryBuilder('conversation');
        conversations = hasMemberColumn
            ? conversations.leftJoinAndSelect('conversation.members', 'members')
            : conversations;
        conversations = conversations.select(columns).getMany();
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

    async conversationExists(id: string): Promise<boolean> {
        const conversation = await Conversation.findOne(id);
        return conversation ? true : false;
    }

    async create(members: string[]) {
        const conversation = new Conversation();
        const users = members.map(member => {
            const user = new User();
            user.id = member;
            return user;
        });
        conversation.members = users;
        return conversation.save();
    }
}
