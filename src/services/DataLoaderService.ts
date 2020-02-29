import DataLoader = require("dataloader");

export class DataLoaderService<K, V, C = K> extends DataLoader<K, V, C> {
  columns: Array<string>;

  constructor(
    batchFn: Function,
    options?: DataLoader.Options<K, V, C>,
    columns = new Array<string>()
  ) {
    super(batchFn(columns), options);
    this.columns = columns;
  }

  private selectColumns(columns: string[]) {
    this.columns.push(...columns);
  }

  loadAndSelect(id: K, columns: string[]) {
    this.selectColumns(columns);
    return this.load(id);
  }
}
