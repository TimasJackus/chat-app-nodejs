import {
    Resolver,
    Mutation,
    Arg,
    Subscription,
    Root,
    Authorized,
} from 'type-graphql';
import { Service } from 'typedi';
import { SubscriptionType } from '../types';

@Service()
@Resolver()
export class SubscriptionResolver {
    @Subscription({
        topics: ({ context }) => {
            return context.user.id;
        },
    })
    subscribe(
        @Root()
        somePayload: {
            content: string;
            sender: string;
            recipient: string;
        }
    ): SubscriptionType {
        return somePayload;
    }
}
