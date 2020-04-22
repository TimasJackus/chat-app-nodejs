import { ObjectType, Field } from 'type-graphql';
import { EventPayload } from './EventPayload';

@ObjectType()
export class SubscriptionEvent {
    constructor(event: string, payload: EventPayload) {
        this.event = event;
        this.payload = payload;
    }

    @Field(() => String)
    event: string;

    @Field(() => EventPayload)
    payload: EventPayload;
}
