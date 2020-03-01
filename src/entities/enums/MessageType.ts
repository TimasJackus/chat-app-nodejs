import { registerEnumType } from 'type-graphql';

export enum MessageType {
    Private = 'PrivateMessage',
    Conversation = 'ConversationMessage',
}

registerEnumType(MessageType, {
    name: 'MessageType',
});
