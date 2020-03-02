import { Resolver, Mutation, Arg, Query, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { User } from '../../entities';
import sha256 from 'sha256';
import { LoginInput, RegisterInput } from '../inputs';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserService } from '../../services';
import { Fields } from '../decorators/FieldsDecorator';
import { AuthResponse } from '../types';

@Service()
@Resolver()
export class UserResolver {
    constructor(private userService: UserService) {}

    @Authorized()
    @Query(() => [User])
    async getUsers(@Fields() fields: (keyof User)[]) {
        return this.userService.getUsers(fields);
    }

    @Authorized()
    @Query(() => User, { nullable: true })
    async getUser(@Arg('id') id: string, @Fields() fields: string[]) {
        return await this.userService.getUserById(id, fields);
    }

    @Mutation(() => User)
    async register(@Arg('data') data: RegisterInput) {
        data.password = sha256(data.password);
        const user = User.create(data);
        await user.save();
        return user;
    }

    @Mutation(() => AuthResponse)
    async login(@Arg('data') data: LoginInput) {
        const user = await User.findOne({ where: { email: data.email } });
        if (user?.password !== sha256(data.password)) {
            throw new GraphQLError("Password doesn't match");
        }
        delete user.password;
        return {
            user,
            token: jwt.sign({ ...user }, config.JWT_SECRET),
        };
    }
}
