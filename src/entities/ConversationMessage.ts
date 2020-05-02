import { ObjectType } from "type-graphql";
import { ChildEntity, ManyToOne } from "typeorm";
import { Conversation } from "./Conversation";
import { MessageType } from "./enums";
import { Message } from "./message/Message";

@ChildEntity(MessageType.Conversation)
@ObjectType()
export class ConversationMessage extends Message {
  @ManyToOne(() => Conversation, (conversation) => conversation.id)
  conversation: string | Conversation;
}
