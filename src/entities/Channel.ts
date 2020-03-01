import { Conversation } from './Conversation';
import { Field, ObjectType } from 'type-graphql';
import { Column, ChildEntity } from 'typeorm';
import { ConversationType } from './enums/ConversationType';

@ChildEntity(ConversationType.Channel)
@ObjectType()
export class Channel extends Conversation {
    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    channelName: ConversationType;

    @Field(() => Boolean, { nullable: true })
    @Column({ nullable: true })
    isPrivate: boolean;
}
