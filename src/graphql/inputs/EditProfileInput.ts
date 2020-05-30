import { InputType, Field } from "type-graphql";

@InputType()
export class EditProfileInput {
  @Field()
  displayName: string;

  @Field({ nullable: true })
  phoneNumber: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  password: string;
}
