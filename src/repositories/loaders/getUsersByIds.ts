import { User } from "../../entities";
import { nullMissingRows } from "../utils";

export function getUserByIds(fieldSet: Set<keyof User>) {
    return async function(ids: any) {
        const fields = Array.from(fieldSet);
        const users = await User.findByIds(ids, { select: fields });
        return nullMissingRows(ids, users);
    }
}