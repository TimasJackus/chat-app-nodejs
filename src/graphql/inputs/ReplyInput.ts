import { InputType, Field, ID } from "type-graphql";
import { User } from "../../entities";
import { MessageType } from "../../entities/enums";

@InputType()
export class ReplyInput {
  @Field(() => ID)
  parentId: string;

  @Field()
  content: string;
}
