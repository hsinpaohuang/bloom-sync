import type { Filter } from '../filters/filter';
import type { StorageHandler } from '../utils/storage';
import type { Synchroniser } from './synchroniser';

type WithSync<T = Record<string, unknown>> = T & {
  updatedAt: number;
};

export class LocalSynchroniser implements Synchroniser {
  private static readonly STORAGE_KEY = 'filterData' as const;

  private storageHandler: StorageHandler;

  private initFilter: () => Filter;

  private _updatedAt = 0;

  constructor(storageHandler: StorageHandler, initFilter: () => Filter) {
    this.storageHandler = storageHandler;
    this.initFilter = initFilter;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  async init() {
    let filterData = await this.getFilterData();
    if (!filterData?.updatedAt) {
      filterData = { updatedAt: Date.now() };

      await this.storageHandler.set(LocalSynchroniser.STORAGE_KEY, filterData);
    }

    return filterData;
  }

  async synchronise(recentHistory: Set<string>) {
    const filterData = await this.getFilterData();

    if (filterData.updatedAt < this._updatedAt && recentHistory.size === 0) {
      // nothing to sync
      return;
    }

    const filter = this.initFilter();
    filter.load(filterData);

    if (recentHistory.size !== 0) {
      recentHistory.forEach(url => {
        filter.put(url);
      });

      await this.storageHandler.set(LocalSynchroniser.STORAGE_KEY, {
        ...filter.export(),
        updatedAt: Date.now(),
      });
    }

    return filter;
  }

  private async getFilterData(): Promise<WithSync> {
    return (
      ((await this.storageHandler.get(
        LocalSynchroniser.STORAGE_KEY,
      )) as WithSync) || {}
    );
  }
}
