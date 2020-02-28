import { Service } from "typedi";
import { FieldsDataLoader } from "./utils";
import { User } from "../entities";
import { getUserByIds } from "./loaders";

@Service()
export class UserRepository {
    private readonly loader: FieldsDataLoader<string, User>;

    constructor() {
      this.loader = new FieldsDataLoader(getUserByIds);
    }

    getUserById(id: string, fields: string[]) {
      return this.loader.loadSelect(id, fields);
    }
}