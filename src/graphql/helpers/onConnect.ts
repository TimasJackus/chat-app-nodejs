import { getUserFromToken } from "./getUserFromToken";

export const onConnect = (connectionParams: any) => {
    const user = getUserFromToken(connectionParams.authorization);
    if (user) {
      return {
        user
      };
    }

    throw new Error("Missing auth token!");
};