import { ObjectType, Field, ID } from 'type-graphql';
import { Message } from '../../entities/Message';

@ObjectType()
export class EventPayload {
    constructor(chatId: string, message: Message) {
        this.chatId = chatId;
        this.message = message;
    }

    @Field(() => ID, { nullable: true })
    chatId: string;

    @Field(() => Message, { nullable: true })
    message: Message;
}
