import { Field, ObjectType } from 'type-graphql';
import { ChildEntity, ManyToOne } from 'typeorm';
import { Message } from './Message';
import { Conversation } from './Conversation';
import { MessageType } from './enums/MessageType';

@ChildEntity(MessageType.Conversation)
@ObjectType()
export class ConversationMessage extends Message {
    @Field(() => Conversation)
    @ManyToOne(
        () => Conversation,
        conversation => conversation.messages
    )
    conversation: Conversation;
}
