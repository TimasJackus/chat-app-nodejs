import { User } from '../../entities';

export interface Context {
    authorization: string;
    requestId?: number;
    user: User;
}
