import { Resolver, Query, Authorized, Arg, Ctx } from "type-graphql";
import { Service } from "typedi";
import { Conversation, User } from "../../entities";
import { ConversationService, UserService } from "../../services";
import { Context, SearchResponse } from "../types";

@Service()
@Resolver(() => Conversation)
export class SearchResolver {
  constructor(
    private userService: UserService,
    private conversationService: ConversationService
  ) {}

  @Authorized()
  @Query(() => SearchResponse)
  async search(@Arg("by", () => String) by: string, @Ctx() context: Context) {
    return {
      users: this.userService.getUsersSearch(by),
      channels: this.conversationService.getChannelsSearch(by, context.user.id),
      conversations: this.conversationService.getConversationSearch(
        by,
        context.user.id
      ),
    };
  }
}
