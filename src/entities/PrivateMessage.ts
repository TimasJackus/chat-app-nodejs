import { Field, ObjectType } from 'type-graphql';
import { ChildEntity, ManyToOne, Column } from 'typeorm';
import { Message } from './Message';
import { User } from './User';
import { MessageType } from './enums/MessageType';

@ChildEntity(MessageType.Private)
@ObjectType()
export class PrivateMessage extends Message {
    @Field(() => User)
    @ManyToOne(
        () => User,
        user => user.id
    )
    recipient: User;
}
