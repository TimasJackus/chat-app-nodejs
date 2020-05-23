import { InputType, Field, ID } from "type-graphql";
import { User } from "../../entities";
import { MessageType } from "../../entities/enums";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@InputType()
export class MessageInput {
  @Field(() => ID, { nullable: true })
  id: string;

  @Field(() => ID)
  targetId: string;

  @Field(() => MessageType)
  type: MessageType;

  @Field({ nullable: true })
  content: string;
}
