import { ObjectType, Field } from "type-graphql";
import { ChildEntity, ManyToOne } from "typeorm";
import { Message } from "./Message";
import { User } from "./User";
import { MessageType } from "./enums";

@ChildEntity(MessageType.Private)
@ObjectType()
export class PrivateMessage extends Message {
  @ManyToOne(() => User, (user) => user.id)
  recipient: string | User;
}
