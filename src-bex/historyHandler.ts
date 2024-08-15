import { debounce } from 'quasar';
import { StandardBloomFilter } from './filters/bloom-filter';
import { CuckooFilter } from './filters/cuckoo-filter';
import { Filter, FilterType } from './filters/filter';
import { RedditSynchroniser } from './synchroniser/redditSynchroniser';
import { Synchroniser, SyncProvider } from './synchroniser/synchroniser';
import { RedditAPI } from './utils/RedditAPI';
import { StorageHandler } from './utils/storage';

export class HistoryHandler {
  private recentHistory = new Set<string>();

  private storageHandler: StorageHandler;

  private filter?: Filter;

  private synchroniser?: Synchroniser<Filter>;

  constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler;
  }

  async init() {
    const [filterType, syncProvider, syncKey, recentHistory] =
      await Promise.all([
        (await this.storageHandler.get('filterType')) ||
          FilterType.StandardBloomFilter,
        (await this.storageHandler.get('syncProvider')) || SyncProvider.Reddit,
        this.storageHandler.get('syncKey'),
        this.storageHandler.get('recentHistory'),
      ]);

    if (recentHistory?.length) {
      this.recentHistory = new Set(recentHistory);
    }

    if (!syncKey) {
      throw new Error('Sync key not found in storage', {
        cause: 'sync_key_missing',
      });
    }

    this.synchroniser = this.initSynchroniser(
      syncProvider,
      filterType,
      syncKey,
    );

    const filterData = await this.synchroniser.init();
    this.filter = this.initFilter(filterType, syncKey);
    this.filter.load(filterData);
  }

  get(url: string) {
    const result =
      this.recentHistory.has(url) || Boolean(this.filter?.get(url));

    if (!result) {
      this.put(url);
    }

    return result;
  }

  async synchronise() {
    if (!this.synchroniser) {
      throw new Error('HistoryHandler has not been initialised yet', {
        cause: 'historyHandler_not_init',
      });
    }

    const history = this.refreshRecentHistory();
    this.filter = await this.synchroniser.synchronise(history);
  }

  private put(url: string) {
    this.recentHistory.add(url);
    debounce(() => {
      this.storageHandler.set('recentHistory', Array.from(this.recentHistory));
    }, 1000);
  }

  private refreshRecentHistory() {
    const { recentHistory } = this;
    this.recentHistory = new Set<string>();
    this.storageHandler.set('recentHistory', []);

    return recentHistory;
  }

  private initSynchroniser(
    provider: SyncProvider,
    filterType: FilterType,
    syncKey: string,
  ) {
    switch (provider) {
      case SyncProvider.Reddit:
        const redditAPI = new RedditAPI(this.storageHandler);
        const initFilter = () => this.initFilter(filterType, syncKey);
        return new RedditSynchroniser(redditAPI, filterType, initFilter);
    }
  }

  private initFilter(filterType: FilterType, syncKey: string) {
    switch (filterType) {
      case FilterType.StandardBloomFilter:
        return new StandardBloomFilter(syncKey, 280_000, 9_700);
      case FilterType.CuckooFilter:
        return new CuckooFilter(syncKey, 1_700);
    }
  }
}
