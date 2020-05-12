import { Service } from "typedi";
import { PrivateMessage } from "../entities/PrivateMessage";
import { UserService } from "./UserService";
import { MessageType } from "../entities/enums";
import { ConversationService } from "./ConversationService";
import { ConversationMessage } from "../entities/ConversationMessage";
import { PubSubEngine } from "type-graphql";
import { SubscriptionEvent } from "../graphql/types";
import { EventPayload } from "../graphql/types/EventPayload";
import { Message } from "../entities/Message";
import { GraphQLError } from "graphql";
import { Conversation, User } from "../entities";
import { EventType } from "../graphql/types/EventType";
import { getRepository } from "typeorm";

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
          const eventPayload = new EventPayload(
            message.senderId,
            privateMessage
          );
          const event = new SubscriptionEvent(EventType.Private, eventPayload);
          await pubSub.publish(message.targetId, event);
        }
        return privateMessage;
      case MessageType.Reply:
        const parentMessage = await Message.findOne(message.targetId, {
          relations: ["sender", "recipient", "conversation"],
        });
        if (!parentMessage) {
          throw new GraphQLError("Message doesn't exist");
        }
        const replyMessage = await this.insertReplyMessage(
          parentMessage,
          message
        );
        await this.publishReplyMessage(
          pubSub,
          replyMessage,
          parentMessage,
          message.senderId
        );
        return replyMessage;
      default:
      case MessageType.Conversation:
        await this.conversationService.checkIfExistsAndHasUser(
          message.targetId,
          message.senderId
        );
        const conversationMessage = await this.insertConversationMessage(
          message
        );
        await this.publishConversationMessage(
          pubSub,
          conversationMessage,
          message.senderId,
          message.targetId,
          message.targetId,
          MessageType.Conversation
        );
        return conversationMessage;
    }
  }

  async publishReplyMessage(
    pubSub: PubSubEngine,
    message: Message,
    parentMessage: Message,
    senderId: string
  ) {
    const parentType = parentMessage.type;
    switch (parentType) {
      case MessageType.Conversation:
        const conversationMessage = parentMessage as ConversationMessage;
        const conversation = conversationMessage.conversation as Conversation;
        await this.publishConversationMessage(
          pubSub,
          message,
          senderId,
          conversationMessage.id,
          conversation.id,
          MessageType.Reply
        );
        break;
      case MessageType.Private:
        const privateMessage = parentMessage as PrivateMessage;
        const sender = privateMessage.sender as User;
        const recipient = privateMessage.recipient as User;
        const recipientId = sender.id === senderId ? recipient.id : sender.id;
        if (recipientId !== senderId) {
          const eventPayload = new EventPayload(privateMessage.id, message);
          const event = new SubscriptionEvent(EventType.Reply, eventPayload);
          await pubSub.publish(recipientId, event);
        }
        break;
    }
  }

  async publishConversationMessage(
    pubSub: PubSubEngine,
    message: ConversationMessage | Message,
    senderId: string,
    targetId: string,
    conversationId: string,
    messageType: MessageType
  ) {
    const eventPayload = new EventPayload(targetId, message);
    console.log({ type: message.type, eventPayload });
    const eventName =
      messageType === MessageType.Conversation
        ? EventType.Conversation
        : EventType.Reply;
    console.log(eventName);
    const event = new SubscriptionEvent(eventName, eventPayload);
    const ids = await this.conversationService.getListenerIds(conversationId);
    ids.forEach((id) => {
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

  async insertReplyMessage(parentMessage: Message, replyMessage: IMessage) {
    if (parentMessage.type === MessageType.Conversation) {
      const conversationMessage = parentMessage as ConversationMessage;
      const conversation = conversationMessage.conversation as Conversation;
      await this.conversationService.checkIfExistsAndHasUser(
        conversation.id,
        replyMessage.senderId
      );
    }
    const reply = Message.create({
      sender: replyMessage.senderId,
      content: replyMessage.content,
      parent: parentMessage,
    });
    return reply.save();
  }

  async insertConversationMessage(message: IMessage) {
    await this.conversationService.getConversation(
      message.targetId,
      message.senderId
    );
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
      relations: ["sender"],
      order: { updatedAt: "ASC" },
    });
  }

  async getPrivateMessages(senderId: string, recipientId: string) {
    return await PrivateMessage.find({
      where: [
        { recipient: recipientId, sender: senderId },
        { recipient: senderId, sender: recipientId },
      ],
      relations: ["sender"],
      order: { updatedAt: "ASC" },
    });
  }

  async getReplies(userId: string, parentId: string) {
    // TODO: Add permission checking
    return await Message.find({
      where: { parent: parentId },
      relations: ["sender"],
      order: { updatedAt: "ASC" },
    });
  }

  async getReplyCount(parentId: string) {
    return await Message.count({ where: { parent: parentId } });
  }
}
