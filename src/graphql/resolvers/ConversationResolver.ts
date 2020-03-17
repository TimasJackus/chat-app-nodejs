import {
    Resolver,
    Query,
    Authorized,
    Mutation,
    Args,
    Ctx,
    Root,
    FieldResolver,
} from 'type-graphql';
import { Service } from 'typedi';
import { Conversation } from '../../entities';
import { ConversationService } from '../../services';
import { ConversationArgs, ChannelArgs } from '../inputs';
import { Context } from '../types';
import { Fields } from '../decorators';
import { ConversationType } from '../../entities/enums';
import { Channel } from '../../entities/Channel';

@Service()
@Resolver(() => Conversation)
export class ConversationResolver {
    constructor(private conversationService: ConversationService) {}

    @Authorized()
    @Query(() => [Conversation])
    async getConversations(@Fields() fields: (keyof Conversation)[]) {
        return await this.conversationService.getAll(fields);
    }

    @Authorized()
    @Mutation(() => Conversation)
    async initConversation(
        @Args() { members, type }: ConversationArgs,
        @Ctx() context: Context
    ) {
        return await this.conversationService.createGroupChat([
            ...members,
            context.user.id,
        ]);
    }

    @Authorized()
    @Mutation(() => Channel)
    async initChannel(
        @Args() { name, isPrivate }: ChannelArgs,
        @Ctx() context: Context
    ) {
        return await this.conversationService.createChannel(
            context.user.id,
            name,
            isPrivate
        );
    }
}
