import DataLoader = require("dataloader");

export default class FieldsDataLoader<K, V, C = K> extends DataLoader<K, V, C> {
    tableName: string;
    fieldSet: Set<string>;
  
    constructor(batchFn: any, tableName: string, options?: DataLoader.Options<K, V, C>, fieldSet = new Set<string>()) {
      super(batchFn(fieldSet, tableName), options);
      this.fieldSet = fieldSet;
      this.tableName = tableName;
    }
  
    addFields(fields: string[]) {
      fields.forEach(field => {
        this.fieldSet.add(`${this.tableName}.${field}`)
      });
    }
  }