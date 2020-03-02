import { InputType, Field, ID } from 'type-graphql';
import { User } from '../../entities';
import { MessageType } from '../../entities/enums';

@InputType()
export class MessageInput {
    @Field(() => ID)
    targetId: string;

    @Field(() => MessageType)
    type: MessageType;

    @Field()
    content: string;
}
