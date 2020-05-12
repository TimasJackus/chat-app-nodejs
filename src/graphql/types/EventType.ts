import { registerEnumType } from "type-graphql";

export enum EventType {
  Private = "PRIVATE_MESSAGE",
  Conversation = "CONVERSATION_MESSAGE",
  Reply = "REPLY_MESSAGE",
}

registerEnumType(EventType, {
  name: "EventType",
});
