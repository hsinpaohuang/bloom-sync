import { Filter } from '../filters/filter';

export type Synchroniser = {
  init(): Promise<Record<string, unknown>>;
  synchronise(recentHistory: Set<string>): Promise<Filter>;
};

export enum SyncProvider {
  Reddit = 'reddit',
}
