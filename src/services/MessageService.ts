import { Service } from 'typedi';
import { PrivateMessage } from '../entities/PrivateMessage';
import { UserService } from './UserService';
import { MessageType } from '../entities/enums';
import { ConversationService } from './ConversationService';
import { ConversationMessage } from '../entities/ConversationMessage';
import { PubSubEngine } from 'type-graphql';
import { Message } from '../entities/Message';

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
                pubSub.publish(message.targetId, privateMessage);
                return privateMessage;
            default:
            case MessageType.Conversation:
                await this.conversationService.checkIfExists(message.targetId);
                const conversationMessage = await this.insertConversationMessage(
                    message
                );
                this.publishConversationMessage(pubSub, conversationMessage);
                return conversationMessage;
        }
    }

    async publishConversationMessage(
        pubSub: PubSubEngine,
        message: ConversationMessage
    ) {
        const ids = await this.conversationService.getListenerIds(
            <string>message.conversation
        );
        ids.forEach(id => {
            pubSub.publish(id, message);
        });
        return ids;
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
        const dbMessage = ConversationMessage.create({
            sender: message.senderId,
            conversation: message.targetId,
            content: message.content,
        });
        return dbMessage.save();
    }
}
