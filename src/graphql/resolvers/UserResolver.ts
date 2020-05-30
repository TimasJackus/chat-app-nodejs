import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { Service } from "typedi";
import { User } from "../../entities";
import sha256 from "sha256";
import { LoginInput, RegisterInput } from "../inputs";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserService } from "../../services";
import { Fields } from "../decorators";
import { AuthResponse, Context } from "../types";
import { PrivateMessage } from "../../entities/PrivateMessage";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { EditProfileInput } from "../inputs/EditProfileInput";
import { FileService } from "../../services/FileService";
import { Message } from "../../entities/Message";

@Service()
@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private fileService: FileService
  ) {}

  @Authorized()
  @Query(() => [User])
  async getUsers(@Fields() fields: (keyof User)[]) {
    return await this.userService.getUsers(fields);
  }

  @Authorized()
  @Query(() => User, { nullable: true })
  async getUser(@Arg("id") id: string, @Fields() fields: string[]) {
    return await this.userService.getUserById(id, fields);
  }

  @Authorized()
  @Mutation(() => User)
  async editProfile(
    @Arg("data") data: EditProfileInput,
    @Arg("image", () => GraphQLUpload, { nullable: true }) image: FileUpload,
    @Ctx() context: Context
  ) {
    if (image) {
      try {
        const imageUrl = await this.fileService.uploadImage(image);
        return this.userService.editUser(data, context.user, imageUrl);
      } catch {
        throw new GraphQLError(
          "Could not upload image! File exceeds 2 MB limit."
        );
      }
    }
    return this.userService.editUser(data, context.user);
  }

  @Mutation(() => AuthResponse)
  async register(@Arg("data") data: RegisterInput) {
    const exists = await User.findOne({ where: { email: data.email } });
    if (exists) {
      throw new GraphQLError("Account already exists!");
    }
    if (data.password.length < 8) {
      throw new GraphQLError("Password should be at least 8 character long");
    }
    if (data.email.length < 5) {
      throw new GraphQLError("Invalid email");
    }
    if (data.displayName.length < 4) {
      throw new GraphQLError(
        "Display Name should be at least 4 character long"
      );
    }
    data.password = sha256(data.password);
    const user = User.create(data);
    await user.save();
    return {
      user,
      token: jwt.sign({ ...user }, config.JWT_SECRET),
    };
  }

  @Mutation(() => AuthResponse)
  async login(@Arg("data") data: LoginInput) {
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

  @FieldResolver(() => String, { nullable: true })
  imageUrl(@Root() message: Message, @Ctx() context: any) {
    if (!message.imageUrl) {
      return message.imageUrl;
    }
    return context.hostname + message.imageUrl;
  }

  @FieldResolver(() => Number)
  async unreadCount(@Root() user: User, @Ctx() context: Context) {
    const messages = await PrivateMessage.find({
      where: [
        { recipient: user.id, sender: context.user.id },
        { recipient: context.user.id, sender: user.id },
      ],
      relations: ["viewedUsers", "sender"],
      order: { updatedAt: "ASC" },
    });

    return messages.filter((message) => {
      if (message.sender) {
        if (
          (message.sender as User).id &&
          (message.sender as User).id === context.user.id
        ) {
          return false;
        }
        if (message.sender === context.user.id) {
          return false;
        }
      }
      if (!message.viewedUsers) {
        return true;
      }
      return !(message.viewedUsers as User[]).find(
        (user: User) => user.id === context.user.id
      );
    }).length;
  }
}
