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
        this.relations = ['members'];
    }

    async checkIfExists(id: string) {
        const conversation = await Conversation.findOne(id);
        if (!conversation) {
            throw new GraphQLError("Conversation doesn't exist");
        }
    }

    async getAll(columns: (keyof Conversation)[]) {
        const conversations = await Conversation.find({
            select: this.filterColumns(columns),
            relations: this.filterRelations(columns),
        });
        // const conversations = await getConnection()
        //     .getRepository(Conversation)
        //     .createQueryBuilder('conversation')
        //     .leftJoinAndSelect('conversation.members', 'member')
        //     .select(['conversation.id', 'member.id'])
        //     .getMany();
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
