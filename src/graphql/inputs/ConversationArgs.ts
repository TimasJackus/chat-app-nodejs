import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class ConversationArgs {
    @Field(() => [String])
    members: string[];
}
