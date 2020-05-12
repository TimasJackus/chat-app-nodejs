import { ObjectType, Field } from "type-graphql";
import { EventPayload } from "./EventPayload";
import { EventType } from "./EventType";

@ObjectType()
export class SubscriptionEvent {
  constructor(event: EventType, payload: EventPayload) {
    this.event = event;
    this.payload = payload;
  }

  @Field(() => EventType)
  event: EventType;

  @Field(() => EventPayload)
  payload: EventPayload;
}
