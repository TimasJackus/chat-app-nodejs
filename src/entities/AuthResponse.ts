import { User } from "./User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class AuthResponse extends User {
    @Field(() => String, { nullable: true })
    token: string;
}