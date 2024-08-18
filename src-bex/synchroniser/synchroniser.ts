import { Filter } from '../filters/filter';

export type Synchroniser = {
  init(): Promise<Record<string, unknown>>;
  synchronise(recentHistory: Set<string>): Promise<Filter | undefined>;
};

export enum SyncProvider {
  Reddit = 'reddit',
}
