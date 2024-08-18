import { Filter } from '../filters/filter';

export type Synchroniser = {
  init(): Promise<Record<string, unknown>>;
  synchronise(recentHistory: Set<string>): Promise<Filter | undefined>;
  readonly updatedAt: number;
};

export enum SyncProvider {
  Local = 'local',
}
