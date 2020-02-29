import { User } from "./User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class SomeSubscription {
    @Field(() => String)
    message: string;

    @Field(() => String)
    date: string;
}