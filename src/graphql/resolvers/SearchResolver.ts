import {
    Resolver,
    Query,
    Authorized,
    Mutation,
    Args,
    Ctx, Arg,
} from 'type-graphql';
import { Service } from 'typedi';
import { Conversation } from '../../entities';
import { ConversationService } from '../../services';
import { ChannelArgs } from '../inputs';
import { Context } from '../types';
import { Fields } from '../decorators';
import { Channel } from '../../entities/Channel';
import { onlyUnique } from '../helpers/onlyUnique';
import { GraphQLError } from 'graphql';

@Service()
@Resolver(() => Conversation)
export class ConversationResolver {
    constructor(private conversationService: ConversationService) {}

    @Authorized()
    @Query(() => [Conversation])
    async getConversations(@Fields() fields: (keyof Conversation)[], @Ctx() context: Context) {
        return await this.conversationService.getAll(fields, context.user.id);
    }

    @Authorized()
    @Query(() => [Channel])
    async getChannels(@Fields() fields: (keyof Channel)[], @Ctx() context: Context) {
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
        return await this.conversationService.addMembers(id, members, context.user.id);
    }

    @Authorized()
    @Mutation(() => Conversation)
    async leaveConversation(
        @Arg("id", () => String) id: string,
        @Ctx() context: Context
    ) {
        return await this.conversationService.leaveConversation(id, context.user.id);
    }
}
