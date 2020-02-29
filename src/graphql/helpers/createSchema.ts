import Container from 'typedi'
import { ResolverData, buildSchema } from 'type-graphql'
import { getUserFromToken } from './getUserFromToken'
import { UserResolver } from '../resolvers'

export const createSchema = () =>
    buildSchema({
        resolvers: [UserResolver],
        container: ({ context }: ResolverData<any>) =>
            Container.of(context.requestId),
        authChecker: ({ context }) => {
            const user = getUserFromToken(context.authorization)
            if (!user) {
                return false
            }
            context.user = user
            return true
        },
    })
