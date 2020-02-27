import { getConnection } from "typeorm";
import { Book } from "../../entities/Book";

export function getBooksByIds(fieldSet: Set<string>, tableName: string) {
    return function(ids: any) {
        const fields = Array.from(fieldSet);
        const books = getConnection()
                    .getRepository(Book)
                    .createQueryBuilder(tableName)
                    .select(fields)
                    .whereInIds(ids)
                    .getMany();
        return books;
    }
}