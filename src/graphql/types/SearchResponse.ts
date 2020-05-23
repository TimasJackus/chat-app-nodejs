import { Conversation, User } from "../../entities";
import { ObjectType, Field } from "type-graphql";
import { Channel } from "../../entities/Channel";

@ObjectType()
export class SearchResponse {
  @Field(() => [User])
  users: User[];

  @Field(() => [Channel])
  channels: Channel[];

  @Field(() => [Conversation])
  conversations: Conversation[];
}
