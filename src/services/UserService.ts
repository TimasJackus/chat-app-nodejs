import { Service } from "typedi";
import { User } from "../entities";
import { DataLoaderService } from "./DataLoaderService";
import { GraphQLError } from "graphql";

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
