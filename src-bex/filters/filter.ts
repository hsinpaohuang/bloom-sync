type GetOutput<T> = { result: false; cache: Readonly<T> } | { result: true };

export interface Filter<T> {
  put(text: string, cache: T): void;
  get(text: string): GetOutput<T>;
  delete(text: string): void;
}
