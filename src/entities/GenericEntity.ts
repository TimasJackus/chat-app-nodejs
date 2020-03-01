import { BaseEntity } from 'typeorm';

export class GenericEntity extends BaseEntity {
    id: string;

    static mapNullObjectsToList<T extends GenericEntity>(
        ids: string[],
        list: T[]
    ) {
        return ids.map(
            (id: string) => list.find(item => item.id === id) || null
        );
    }

    static async findAndSelectByIds<T extends GenericEntity>(
        ids: string[],
        select: (keyof T)[]
    ) {
        const entities = await this.findByIds(ids, { select });
        return this.mapNullObjectsToList(ids, entities);
    }
}
