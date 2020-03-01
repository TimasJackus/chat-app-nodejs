import { Service } from 'typedi';
import { Resolver, Root, FieldResolver, ResolverInterface } from 'type-graphql';
import { Message } from '../../entities/Message';
import { Fields } from '../decorators';
import { UserService } from '../../services';

@Service()
@Resolver(() => Message)
export class MessageResolver implements ResolverInterface<Message> {
    constructor(protected userService: UserService) {}

    @FieldResolver()
    sender(@Root() message: Message, @Fields() fields: string[]) {
        return this.userService.getUserById(message.sender.toString(), fields);
    }
}
