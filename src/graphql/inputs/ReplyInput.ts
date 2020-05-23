import { InputType, Field, ID } from "type-graphql";
import { User } from "../../entities";
import { MessageType } from "../../entities/enums";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@InputType()
export class ReplyInput {
  @Field(() => ID, { nullable: true })
  id: string;

  @Field(() => ID)
  parentId: string;

  @Field({ nullable: true })
  content: string;
}
