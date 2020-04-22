import {
    Resolver,
    Subscription,
    Root
} from 'type-graphql';
import { Service } from 'typedi';
import { SubscriptionEvent } from '../types';

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
        payload: SubscriptionEvent
    ): SubscriptionEvent {
        return payload;
    }
}
