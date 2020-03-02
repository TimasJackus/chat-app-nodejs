import { registerEnumType } from 'type-graphql';

export enum ConversationType {
    Group = 'Conversation',
    Channel = 'Channel',
}

registerEnumType(ConversationType, {
    name: 'ConversationType',
});
