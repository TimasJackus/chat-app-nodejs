import { Service } from 'typedi';
import {
    Resolver,
    Mutation,
    Arg,
    Ctx,
    Authorized,
    Root,
    FieldResolver,
    PubSubEngine,
    PubSub,
} from 'type-graphql';
import { PrivateMessageInput } from '../inputs';
import { PrivateMessage } from '../../entities/PrivateMessage';
import { Fields } from '../decorators';
import { MessageResolver } from './MessageResolver';

@Service()
@Resolver(() => PrivateMessage)
export class PrivateMessageResolver extends MessageResolver {
    @Authorized()
    @Mutation(() => PrivateMessage)
    async sendMessage(
        @Arg('data') data: PrivateMessageInput,
        @Ctx() context: any,
        @PubSub() pubSub: PubSubEngine
    ) {
        const { user } = context;
        const message = PrivateMessage.create({});
        message.sender = user.id;
        message.recipient = data.recipientId as any;
        message.content = data.content;
        await message.save();
        const payload = {
            message: message.content,
            sender: message.sender,
            recipient: message.recipient,
        };
        await pubSub.publish(message.recipient as any, payload);
        return message;
    }

    @FieldResolver()
    recipient(@Root() message: PrivateMessage, @Fields() fields: string[]) {
        return this.userService.getUserById(
            message.recipient.toString(),
            fields
        );
    }
}
