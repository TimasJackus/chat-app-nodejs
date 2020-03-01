import { Resolver, Query, Authorized, Mutation } from 'type-graphql';
import { Service } from 'typedi';
import { Conversation } from '../../entities';

@Service()
@Resolver()
export class ConversationResolver {
    constructor() {}

    @Authorized()
    @Query(() => [Conversation])
    async getConversations() {
        return [];
    }

    @Authorized()
    @Mutation(() => [Conversation])
    async initConversation() {}
}
