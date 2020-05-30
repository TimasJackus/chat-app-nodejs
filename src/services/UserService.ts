import { Service } from "typedi";
import { User } from "../entities";
import { DataLoaderService } from "./DataLoaderService";
import { GraphQLError } from "graphql";
import { Message } from "../entities/Message";
import sha256 from "sha256";
import { EditProfileInput } from "../graphql/inputs/EditProfileInput";

@Service()
export class UserService {
  private readonly userLoader: DataLoaderService<
    string,
    User
  > = new DataLoaderService(this.batchUsersByIds);

  getUserById(id: string, fields: string[]) {
    return this.userLoader.loadAndSelect(id, fields);
  }

  getUsers(columns: (keyof User)[]) {
    columns = columns.filter((column) => column !== "unreadCount");
    return User.find({ select: columns });
  }

  async getUsersSearch(by: string) {
    return await User.createQueryBuilder()
      .where("User.displayName ILIKE :by", { by: `%${by}%` })
      .limit(5)
      .getMany();
  }

  getUsersByIds(ids: string[]) {
    return User.findByIds(ids);
  }

  async editUser(data: EditProfileInput, user: User, imageUrl?: string) {
    console.log("user: ", user);
    const userData: any = {
      id: user.id,
      displayName: data.displayName || user.displayName,
      imageUrl: imageUrl || user.imageUrl,
      phoneNumber: data.phoneNumber || user.phoneNumber,
      description: data.description || user.description,
    };
    if (data.password && data.password.length < 8) {
      throw new GraphQLError("Password should be at least 8 character long");
    }
    if (data.displayName.length < 4) {
      throw new GraphQLError(
        "Display Name should be at least 4 character long"
      );
    }
    if (data.password) {
      Object.assign(userData, { password: sha256(data.password) });
    }
    await User.update({ id: userData.id }, userData);
    return {
      ...user,
      ...userData,
    };
  }

  async checkIfExists(id: string) {
    const user = await User.findOne(id);
    if (!user) {
      throw new GraphQLError("User doesn't exist");
    }
  }

  private batchUsersByIds(columns: (keyof User)[]) {
    return async function (ids: string[]) {
      return User.findAndSelectByIds(ids, columns);
    };
  }
}
