import { AuthChecker } from "type-graphql";
import jwt from 'jsonwebtoken';
import { config } from "./config";

export const authChecker: AuthChecker<any> = ({ context }, roles) => {
    const authorization = context.authorization.replace(/^Bearer\s/, '').replace(/^bearer\s/, '');
    const user = jwt.verify(authorization, config.JWT_SECRET);
    if (!user) {
        return false;
    }
    context.user = user;
    return true;
};