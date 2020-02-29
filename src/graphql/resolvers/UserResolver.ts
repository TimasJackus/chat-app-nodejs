import {
    Resolver,
    Mutation,
    Arg,
    Query,
    Authorized,
    Subscription,
    Root,
    PubSub,
    PubSubEngine,
} from 'type-graphql'
import { Service } from 'typedi'
import { User, AuthResponse, SomeSubscription } from '../../entities'
import sha256 from 'sha256'
import { LoginInput, RegisterInput } from '../inputs'
import { GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { UserService } from '../../services'
import { Fields } from '../decorators/FieldsDecorator'

@Service()
@Resolver()
export class UserResolver {
    constructor(private userService: UserService) {}

    @Authorized()
    @Query(() => User, { nullable: true })
    async getUser(@Arg('id') id: string, @Fields() fields: string[]) {
        return await this.userService.getUserById(id, fields)
    }

    @Mutation(() => AuthResponse)
    async register(@Arg('data') data: RegisterInput) {
        data.password = sha256(data.password)
        const user = User.create(data)
        await user.save()
        return user
    }

    @Mutation(() => AuthResponse)
    async login(@Arg('data') data: LoginInput) {
        const user = await User.findOne({ where: { email: data.email } })
        if (user?.password !== sha256(data.password)) {
            throw new GraphQLError("Password doesn't match")
        }
        delete user.password
        return {
            ...user,
            token: jwt.sign({ ...user }, config.JWT_SECRET),
        }
    }

    @Subscription({
        topics: ({ context }) => {
            return context.user.id
        },
        filter: () => {
            return true
        },
    })
    someSubscription(
        @Root() somePayload: { message: string; date: string }
    ): SomeSubscription {
        return somePayload
    }

    @Mutation(returns => Boolean)
    async addSomething(
        @Arg('message') message: string,
        @Arg('id') id: string,
        @PubSub() pubSub: PubSubEngine
    ) {
        const payload = {
            message,
            date: Date.now().toLocaleString(),
        }
        await pubSub.publish(id, payload)
        return true
    }

    @Query(() => String)
    async queryForTesting(@Arg('param') param: string) {
        return Promise.resolve(param)
    }
}
