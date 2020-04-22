import { Service } from 'typedi';
import { PrivateMessage } from '../entities/PrivateMessage';
import { UserService } from './UserService';
import { MessageType } from '../entities/enums';
import { ConversationService } from './ConversationService';
import { ConversationMessage } from '../entities/ConversationMessage';
import { PubSubEngine } from 'type-graphql';
import { SubscriptionEvent } from '../graphql/types';
import { EventPayload } from '../graphql/types/EventPayload';

interface IMessage {
    senderId: string;
    targetId: string;
    type: string;
    content: string;
}

@Service()
export class MessageService {
    constructor(
        private userService: UserService,
        private conversationService: ConversationService
    ) {}

    async insertAndPublish(pubSub: PubSubEngine, message: IMessage) {
        switch (message.type) {
            case MessageType.Private:
                await this.userService.checkIfExists(message.targetId);
                const privateMessage = await this.insertPrivateMessage(message);
                if (message.targetId !== message.senderId) {
                    const eventPayload = new EventPayload(message.senderId, privateMessage);
                    const event = new SubscriptionEvent("PRIVATE_MESSAGE", eventPayload);
                    await pubSub.publish(message.targetId, event);
                }
                return privateMessage;
            default:
            case MessageType.Conversation:
                await this.conversationService.checkIfExists(message.targetId);
                const conversationMessage = await this.insertConversationMessage(
                    message
                );
                await this.publishConversationMessage(pubSub, conversationMessage, message.senderId, message.targetId);
                return conversationMessage;
        }
    }

    async publishConversationMessage(
        pubSub: PubSubEngine,
        message: ConversationMessage,
        senderId: string,
        targetId: string
    ) {
        const eventPayload = new EventPayload(targetId, message);
        const event = new SubscriptionEvent("CONVERSATION_MESSAGE", eventPayload);
        const ids = await this.conversationService.getListenerIds(
            <string>message.conversation
        );
        ids.forEach(id => {
            if (id !== senderId) {
                pubSub.publish(id, event);
            }
        });
    }

    async insertPrivateMessage(message: IMessage) {
        const dbMessage = PrivateMessage.create({
            sender: message.senderId,
            recipient: message.targetId,
            content: message.content,
        });
        return dbMessage.save();
    }

    async insertConversationMessage(message: IMessage) {
        await this.conversationService.getConversation(message.targetId, message.senderId);
        const dbMessage = ConversationMessage.create({
            sender: message.senderId,
            conversation: message.targetId,
            content: message.content,
        });
        return dbMessage.save();
    }

    async getConversationMessages(conversationId: string, userId: string) {
        await this.conversationService.getConversation(conversationId, userId);
        return ConversationMessage.find({
            where: { conversation: conversationId },
            relations: ['sender'],
        });
    }

    async getPrivateMessages(senderId: string, recipientId: string) {
        return PrivateMessage.find({
            where: [
                { recipient: recipientId, sender: senderId },
                { recipient: senderId, sender: recipientId },
            ],
            relations: ['sender', 'recipient'],
        });
    }
}
