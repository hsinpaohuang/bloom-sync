import { Filter } from '../filters/filter';

export type Synchroniser<T extends Filter> = {
  init(): Promise<Record<string, unknown>>;
  synchronise(recentHistory: Set<string>): Promise<T>;
};

export enum SyncProvider {
  Reddit = 'reddit',
}
