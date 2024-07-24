type GetOutput = { result: false; cache: number[] } | { result: true };

export interface Filter {
  put(text: string, cache: number[]): void;
  get(text: string): GetOutput;
  delete(text: string): void;
}
