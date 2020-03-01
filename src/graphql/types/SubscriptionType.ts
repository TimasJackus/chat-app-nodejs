import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class SubscriptionType {
    @Field(() => String)
    message: string;

    @Field(() => ID)
    sender: string;

    @Field(() => ID, { nullable: true })
    recipient: string;
}
