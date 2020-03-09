import { Service } from 'typedi';

@Service()
export class BaseService<T> {
    adjustColumns(columns: string[], aliasName: string) {
        return columns.map(column => {
            if (column.includes('.')) {
                return column;
            }
            return `${aliasName}.${column}`;
        });
    }
}
