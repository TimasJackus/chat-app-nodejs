import { Service } from "typedi";
import { UserRepository } from '../repositories';

@Service()
export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    getUserById(id: string, fields: string[]) {
        return this.userRepository.getUserById(id, fields);
    }
}