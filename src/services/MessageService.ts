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
import { IMessage } from "../graphql/types/IMessage";
import { getConnection } from "typeorm";
import { Reaction } from "../entities/Reaction";

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
          relations: [
            "sender",
            "recipient",
            "conversation",
            "pinnedUsers",
            "reactions",
            "reactions.user",
          ],
        });
        if (!parentMessage) {
          throw new GraphQLError("Parent message doesn't exist");
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
    const eventName =
      messageType === MessageType.Conversation
        ? EventType.Conversation
        : EventType.Reply;
    const event = new SubscriptionEvent(eventName, eventPayload);
    const ids = await this.conversationService.getListenerIds(conversationId);
    ids.forEach((id) => {
      if (id !== senderId) {
        pubSub.publish(id, event);
      }
    });
  }

  async insertPrivateMessage(message: IMessage) {
    if (message.id) {
      const dbMessage = await PrivateMessage.findOne(message.id, {
        relations: ["sender", "pinnedUsers", "reactions", "reactions.user"],
      });
      if (!dbMessage) {
        throw new GraphQLError("Message doesn't exist");
      }
      if (message.content) {
        dbMessage.content = message.content;
      }
      return dbMessage.save();
    }
    const dbMessage = PrivateMessage.create({
      sender: message.senderId,
      recipient: message.targetId,
      content: message.content || undefined,
      imageUrl: message.imageUrl || undefined,
      type: MessageType.Private,
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
      content: replyMessage.content || undefined,
      imageUrl: replyMessage.imageUrl || undefined,
      parent: parentMessage,
      type: MessageType.Reply,
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
      content: message.content || undefined,
      imageUrl: message.imageUrl || undefined,
      type: MessageType.Conversation,
    });
    return dbMessage.save();
  }

  async getConversationMessages(conversationId: string, userId: string) {
    await this.conversationService.getConversation(conversationId, userId);
    const messages = await ConversationMessage.find({
      where: { conversation: conversationId },
      relations: [
        "sender",
        "pinnedUsers",
        "viewedUsers",
        "reactions",
        "reactions.user",
      ],
      order: { updatedAt: "ASC" },
    });
    const values = messages
      .filter((m) => {
        return !(m.viewedUsers as User[]).find((u) => u.id === userId);
      })
      .map((m) => {
        return { messageId: m.id, userId: userId };
      });

    if (values.length > 0) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into("messages_viewed")
        .values(values)
        .execute();
    }

    return messages;
  }

  async getPrivateMessages(senderId: string, recipientId: string) {
    const messages = await PrivateMessage.find({
      where: [
        { recipient: recipientId, sender: senderId },
        { recipient: senderId, sender: recipientId },
      ],
      relations: [
        "sender",
        "pinnedUsers",
        "viewedUsers",
        "reactions",
        "reactions.user",
      ],
      order: { updatedAt: "ASC" },
    });

    const values = messages
      .filter((m) => {
        return !(m.viewedUsers as User[]).find((u) => u.id === senderId);
      })
      .map((m) => {
        return { messageId: m.id, userId: senderId };
      });

    if (values.length > 0) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into("messages_viewed")
        .values(values)
        .execute();
    }
    return messages;
  }

  async getPinnedMessages(userId: string) {
    const messages = await Message.find({
      relations: ["sender", "pinnedUsers", "reactions", "reactions.user"],
      where: [{ recipient: userId }, { sender: userId }],
    });
    return messages.filter(
      (m) =>
        !!(m.pinnedUsers as User[]).find((user: User) => user.id === userId)
    );
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await Message.findOne(
      { id: messageId },
      { relations: ["sender", "pinnedUsers", "reactions", "reactions.user"] }
    );
    if (!message) {
      throw new GraphQLError("Message not found");
    }
    if ((message.sender as User).id !== userId) {
      throw new GraphQLError("You are not allowed to delete this message");
    }
    await message.remove();
    return "OK";
  }

  async getReplies(userId: string, parentId: string) {
    return await Message.find({
      where: { parent: parentId },
      relations: ["sender", "pinnedUsers", "reactions", "reactions.user"],
      order: { updatedAt: "ASC" },
    });
  }

  async togglePinned(messageId: string, userId: string) {
    const message = await Message.findOne(messageId, {
      relations: [
        "pinnedUsers",
        "sender",
        "recipient",
        "conversation",
        "reactions",
        "reactions.user",
      ],
    });
    if (!message) {
      throw new GraphQLError("Message does not exist");
    }
    message.pinnedUsers = message.pinnedUsers as User[];
    const exists = message.pinnedUsers.find((user: User) => user.id === userId);
    if (exists) {
      message.pinnedUsers = message.pinnedUsers.filter(
        (user: User) => user.id !== userId
      );
      return message.save();
    }
    const pinnedUsers = await this.userService.getUsersByIds([userId]);
    message.pinnedUsers = message.pinnedUsers.concat(pinnedUsers);
    return await message.save();
  }

  async toggleReact(react: string, messageId: string, user: User) {
    const message = await Message.findOne(messageId, {
      relations: [
        "pinnedUsers",
        "sender",
        "conversation",
        "reactions",
        "reactions.user",
      ],
    });
    if (!message) {
      throw new GraphQLError("Message does not exist");
    }
    const exists = message.reactions.find((reaction) => {
      return reaction.react === react && (reaction.user as User).id === user.id;
    });
    if (exists) {
      message.reactions = message.reactions.filter(
        (reaction) => reaction.id !== exists.id
      );
      return message.save();
    }
    const reaction = Reaction.create({
      user,
      message,
      react,
    });
    await reaction.save();

    message.reactions = message.reactions.concat([reaction]);
    return await message.save();
  }

  async getReplyCount(parentId: string) {
    return await Message.count({ where: { parent: parentId } });
  }
}
