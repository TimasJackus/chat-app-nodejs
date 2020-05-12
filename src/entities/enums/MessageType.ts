import { registerEnumType } from "type-graphql";

export enum MessageType {
  Private = "PrivateMessage",
  Conversation = "ConversationMessage",
  Reply = "Message",
}

registerEnumType(MessageType, {
  name: "MessageType",
});
