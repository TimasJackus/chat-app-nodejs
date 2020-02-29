import jwt from 'jsonwebtoken';
import { config } from "./config";

export const getUserFromToken = (bearerToken: string) => {
    if (!bearerToken) {
        return null;
    }
    const token = bearerToken.replace(/^Bearer\s/, '').replace(/^bearer\s/, '');
    const user = jwt.verify(token, config.JWT_SECRET);
    return user;
};