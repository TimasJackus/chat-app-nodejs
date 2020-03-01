import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class PrivateMessageInput {
    @Field(() => ID)
    recipientId: string;

    @Field()
    content: string;
}
