import { Filter } from '../filters/filter';

export type Synchroniser<T extends Filter<Record<string, unknown>, unknown>> = {
  synchronise(recentHistory: Set<string>): Promise<T>;
};
