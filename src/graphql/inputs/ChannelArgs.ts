import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class ChannelArgs {
    @Field(() => String)
    name: string;

    @Field(() => Boolean)
    isPrivate: boolean;
}
