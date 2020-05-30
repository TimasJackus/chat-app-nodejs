import { Service } from "typedi";
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
  ResolverInterface,
  Root,
} from "type-graphql";
import { Message } from "../../entities/Message";
import { Fields } from "../decorators";
import { MessageService, UserService } from "../../services";
import { MessageInput, ReplyInput } from "../inputs";
import { Context } from "vm";
import { MessageType } from "../../entities/enums";
import { FileService } from "../../services/FileService";
import { GraphQLError } from "graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { User } from "../../entities";

@Service()
@Resolver(() => Message)
export class MessageResolver implements ResolverInterface<Message> {
  constructor(
    protected userService: UserService,
    protected messageService: MessageService,
    protected fileService: FileService
  ) {}

  @Authorized()
  @Mutation(() => Message)
  async sendMessage(
    @Arg("data") data: MessageInput,
    @Arg("image", () => GraphQLUpload, { nullable: true }) image: FileUpload,
    @Ctx() context: Context,
    @PubSub() pubSub: PubSubEngine
  ) {
    if (image) {
      try {
        const imageUrl = await this.fileService.uploadImage(image);
        return await this.messageService.insertAndPublish(pubSub, {
          id: data.id,
          senderId: context.user.id,
          targetId: data.targetId,
          type: data.type,
          content: null,
          imageUrl,
        });
      } catch {
        throw new GraphQLError(
          "Could not upload image! File exceeds 2 MB limit."
        );
      }
    }
    if (!data.content) {
      return new GraphQLError("Message cannot be empty!");
    }
    return await this.messageService.insertAndPublish(pubSub, {
      id: data.id,
      senderId: context.user.id,
      targetId: data.targetId,
      type: data.type,
      content: data.content,
      imageUrl: null,
    });
  }

  @Authorized()
  @Mutation(() => Message)
  async sendReply(
    @Arg("data") data: ReplyInput,
    @Arg("image", () => GraphQLUpload, { nullable: true }) image: FileUpload,
    @Ctx() context: Context,
    @PubSub() pubSub: PubSubEngine
  ) {
    if (image) {
      try {
        const imageUrl = await this.fileService.uploadImage(image);
        return await this.messageService.insertAndPublish(pubSub, {
          id: data.id,
          senderId: context.user.id,
          targetId: data.parentId,
          type: MessageType.Reply,
          content: null,
          imageUrl,
        });
      } catch (err) {
        throw new GraphQLError(err);
      }
    }
    if (!data.content) {
      return new GraphQLError("Message cannot be empty!");
    }
    return await this.messageService.insertAndPublish(pubSub, {
      id: data.id,
      senderId: context.user.id,
      targetId: data.parentId,
      type: MessageType.Reply,
      content: data.content,
      imageUrl: null,
    });
  }

  @Authorized()
  @Mutation(() => String)
  async deleteMessage(
    @Arg("messageId") messageId: string,
    @Ctx() context: Context
  ) {
    return this.messageService.deleteMessage(messageId, context.user.id);
  }

  @Authorized()
  @Mutation(() => Message)
  async togglePinned(
    @Arg("id", () => String) id: string,
    @Ctx() context: Context
  ) {
    return await this.messageService.togglePinned(id, context.user.id);
  }

  @Authorized()
  @Query(() => [Message])
  async conversationMessages(
    @Arg("conversationId") conversationId: string,
    @Ctx() context: Context
  ) {
    return this.messageService.getConversationMessages(
      conversationId,
      context.user.id
    );
  }

  @Authorized()
  @Query(() => [Message])
  async messages(@Arg("userId") recipientId: string, @Ctx() context: Context) {
    return this.messageService.getPrivateMessages(context.user.id, recipientId);
  }

  @Authorized()
  @Query(() => [Message])
  async pinnedMessages(@Ctx() context: Context) {
    return this.messageService.getPinnedMessages(context.user.id);
  }

  @Authorized()
  @Query(() => [Message])
  async replies(@Arg("parentId") parentId: string, @Ctx() context: Context) {
    return this.messageService.getReplies(context.user.id, parentId);
  }

  @Authorized()
  @Mutation(() => Message)
  async toggleReaction(
    @Arg("react") react: string,
    @Arg("messageId") messageId: string,
    @Ctx() context: Context
  ) {
    return this.messageService.toggleReact(react, messageId, context.user);
  }

  @FieldResolver()
  sender(@Root() message: Message, @Fields() fields: string[]) {
    if (typeof message.sender === "string") {
      return this.userService.getUserById(message.sender.toString(), fields);
    }
    return message.sender;
  }

  @FieldResolver(() => String, { nullable: true })
  imageUrl(@Root() message: Message, @Ctx() context: Context) {
    if (!message.imageUrl) {
      return message.imageUrl;
    }
    return context.hostname + message.imageUrl;
  }

  @FieldResolver(() => Int, { nullable: true })
  replyCount(@Root() message: Message) {
    return this.messageService.getReplyCount(message.id);
  }

  @FieldResolver(() => String, { nullable: true })
  parent(@Root() message: Message) {
    return typeof message.parent === "string"
      ? message.parent
      : message.parent?.id;
  }

  @FieldResolver(() => Boolean)
  pinned(@Root() message: Message, @Ctx() context: Context) {
    if (!message.pinnedUsers) {
      return false;
    }
    return !!(message.pinnedUsers as User[]).find(
      (user: User) => user.id === context.user.id
    );
  }

  @FieldResolver(() => Boolean)
  viewed(@Root() message: Message, @Ctx() context: Context) {
    if (message.sender) {
      if (
        (message.sender as User).id &&
        (message.sender as User).id === context.user.id
      ) {
        return true;
      }
      if (message.sender === context.user.id) {
        return true;
      }
    }
    if (!message.viewedUsers) {
      return false;
    }
    return !!(message.viewedUsers as User[]).find(
      (user: User) => user.id === context.user.id
    );
  }
}
