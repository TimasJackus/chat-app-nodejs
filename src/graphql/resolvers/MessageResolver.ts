import { Service } from 'typedi';
import {
    Resolver,
    Root,
    FieldResolver,
    ResolverInterface,
    Authorized,
    Mutation,
    Arg,
    Ctx,
    PubSub,
    PubSubEngine,
    Query,
    Args,
} from 'type-graphql';
import { Message } from '../../entities/Message';
import { Fields } from '../decorators';
import { UserService, MessageService } from '../../services';
import { MessageInput } from '../inputs';
import { Context } from 'vm';
import { PrivateMessage } from '../../entities/PrivateMessage';

@Service()
@Resolver(() => Message)
export class MessageResolver implements ResolverInterface<Message> {
    constructor(
        protected userService: UserService,
        protected messageService: MessageService
    ) {}

    @Authorized()
    @Mutation(() => Message)
    async sendMessage(
        @Arg('data') data: MessageInput,
        @Ctx() context: Context,
        @PubSub() pubSub: PubSubEngine
    ) {
        const payload = await this.messageService.insertAndPublish(pubSub, {
            senderId: context.user.id,
            targetId: data.targetId,
            type: data.type,
            content: data.content,
        });
        return payload;
    }

    @Authorized()
    @Query(() => [Message])
    async getConversationMessages(
        @Arg('conversationId') conversationId: string,
        @Ctx() context: Context
    ) {
        return this.messageService.getConversationMessages(conversationId);
    }

    @Authorized()
    @Query(() => [PrivateMessage])
    async getPrivateMessages(
        @Arg('userId') recipientId: string,
        @Ctx() context: Context
    ) {
        return this.messageService.getPrivateMessages(
            context.user.id,
            recipientId
        );
    }

    @FieldResolver()
    sender(@Root() message: Message, @Fields() fields: string[]) {
        if (typeof message.sender === 'string') {
            return this.userService.getUserById(
                message.sender.toString(),
                fields
            );
        }
        return message.sender;
    }
}
