export interface Filter<FilterData = Record<string, unknown>> {
  put(text: string): void;
  get(text: string): boolean;
  delete(text: string): void;
  export(): FilterData;
  load(filter: Partial<FilterData>): void;
}

export enum FilterType {
  StandardBloomFilter = 'StandardBloomFilter',
  CuckooFilter = 'CuckooFilter',
}
