import { Service } from "typedi";
import { User } from "../entities";
import { DataLoaderService } from "./DataLoaderService";

@Service()
export class UserService {
    private readonly userLoader: DataLoaderService<string, User> = new DataLoaderService(this.batchUsersByIds);

    constructor() { }

    getUserById(id: string, fields: string[]) {
        return this.userLoader.loadAndSelect(id, fields);
    }

    batchUsersByIds(columns: (keyof User)[]) {
        return async function(ids: string[]) {
            return User.findAndSelectByIds(ids, columns);
        }
    }
}