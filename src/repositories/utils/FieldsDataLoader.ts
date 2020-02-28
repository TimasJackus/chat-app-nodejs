import DataLoader = require("dataloader");

export class FieldsDataLoader<K, V, C = K> extends DataLoader<K, V, C> {
    fieldSet: Set<string>;
  
    constructor(batchFn: any, options?: DataLoader.Options<K, V, C>, fieldSet = new Set<string>()) {
      super(batchFn(fieldSet), options);
      this.fieldSet = fieldSet;
    }
  
    addFields(fields: string[]) {
      fields.forEach(field => {
        this.fieldSet.add(field)
      });
    }

    loadSelect(id: K, fields: string[]) {
      this.addFields(fields);
      return this.load(id);
    }
  }