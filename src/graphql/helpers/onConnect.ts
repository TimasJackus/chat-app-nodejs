import { getUserFromToken } from './getUserFromToken';

interface ConnectionParams {
    authorization: string;
}

export const onConnect = (connectionParams: Object) => {
    const token = (connectionParams as ConnectionParams).authorization;
    const user = getUserFromToken(token);
    if (user) {
        return {
            user,
        };
    }

    throw new Error('Missing auth token!');
};
