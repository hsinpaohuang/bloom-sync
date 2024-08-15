import type { FilterType } from '../filters/filter';
import { SyncProvider } from '../synchroniser/synchroniser';

export type Storage = {
  syncKey: string;
  redditRefreshToken: string;
  filterType: FilterType;
  syncProvider: SyncProvider;
  recentHistory: string[];
};

export class StorageHandler {
  async get<K extends keyof Storage>(key: K): Promise<Partial<Storage>[K]> {
    const item = await chrome.storage.local.get(key);
    return item[key];
  }

  async set<K extends keyof Storage>(key: K, value: Storage[K]) {
    await chrome.storage.local.set({ [key]: value });
  }
}
