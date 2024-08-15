type GetOutput<Cache> =
  | { result: false; cache: Readonly<Cache> }
  | { result: true };

export interface Filter<FilterData extends Record<string, unknown>, Cache> {
  put(text: string, cache?: Cache): void;
  get(text: string): GetOutput<Cache>;
  delete(text: string): void;
  export(): FilterData;
  load(filter: FilterData): void;
}
