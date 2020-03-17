import { ArgsType, Field } from 'type-graphql';
import { ConversationType } from '../../entities/enums';

@ArgsType()
export class ConversationArgs {
    @Field(() => [String])
    members: string[];

    @Field(() => [ConversationType])
    type: ConversationType;
}
