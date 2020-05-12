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
import { PrivateMessage } from "../../entities/PrivateMessage";
import { MessageType } from "../../entities/enums";

@Service()
@Resolver(() => Message)
export class MessageResolver implements ResolverInterface<Message> {
  constructor(
    protected userService: UserService,
    protected messageService: MessageService
  ) {}

  @Authorized()
  @Mutation(() => Message)
  async sendMessage(
    @Arg("data") data: MessageInput,
    @Ctx() context: Context,
    @PubSub() pubSub: PubSubEngine
  ) {
    return await this.messageService.insertAndPublish(pubSub, {
      senderId: context.user.id,
      targetId: data.targetId,
      type: data.type,
      content: data.content,
    });
  }

  @Authorized()
  @Mutation(() => Message)
  async sendReply(
    @Arg("data") data: ReplyInput,
    @Ctx() context: Context,
    @PubSub() pubSub: PubSubEngine
  ) {
    return await this.messageService.insertAndPublish(pubSub, {
      senderId: context.user.id,
      targetId: data.parentId,
      type: MessageType.Reply,
      content: data.content,
    });
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
  async replies(@Arg("parentId") parentId: string, @Ctx() context: Context) {
    return this.messageService.getReplies(context.user.id, parentId);
  }

  @FieldResolver()
  sender(@Root() message: Message, @Fields() fields: string[]) {
    if (typeof message.sender === "string") {
      return this.userService.getUserById(message.sender.toString(), fields);
    }
    return message.sender;
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
}
