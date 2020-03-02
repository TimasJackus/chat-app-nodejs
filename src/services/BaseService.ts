import { Service } from 'typedi';

@Service()
export class BaseService<T> {
    protected relations: (keyof T)[];

    filterColumns(columns: (keyof T)[]) {
        return (columns = columns.filter(
            column => !this.relations.includes(column)
        ));
    }

    filterRelations(columns: (keyof T)[]) {
        return this.relations.filter(relation => columns.includes(relation));
    }
}
