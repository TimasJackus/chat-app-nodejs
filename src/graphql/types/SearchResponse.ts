import { User } from '../../entities/User'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class AuthResponse {
    @Field(() => String, { nullable: true })
    token: string

    @Field(() => User)
    user: User
}
