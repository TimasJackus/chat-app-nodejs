import { registerEnumType } from 'type-graphql';

export enum ConversationType {
    Group = 'Group',
    Channel = 'Channel',
}

registerEnumType(ConversationType, {
    name: 'ConversationType',
});
