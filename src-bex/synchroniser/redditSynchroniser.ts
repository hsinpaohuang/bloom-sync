import type { Filter, FilterType } from '../filters/filter';
import { RedditAPI } from '../utils/RedditAPI';
import type { Synchroniser } from './synchroniser';

type WithSync<T = Record<string, unknown>> = T & {
  lockedAt: number | null;
  updatedAt: number;
};

export class RedditSynchroniser implements Synchroniser {
  private redditAPI: RedditAPI;

  private filterType: string;

  private initFilter: () => Filter;

  private username = '';

  private filterPostInfo = { url: '', name: '' };

  private _updatedAt = 0; // timestamp

  constructor(
    reditAPI: RedditAPI,
    filterType: FilterType,
    initFilter: () => Filter,
  ) {
    this.redditAPI = reditAPI;
    this.filterType = filterType;
    this.initFilter = initFilter;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  async init(): Promise<WithSync> {
    this.username = await this.redditAPI.getMe();
    const filterPost = await this.findFilter();

    if (filterPost) {
      this.filterPostInfo = {
        url: RedditAPI.convertToOAuthURL(filterPost.url),
        name: filterPost.name,
      };
      return JSON.parse(filterPost.selftext || '{}');
    }

    this.filterPostInfo = await this.makePost();

    this.filterPostInfo.url = RedditAPI.convertToOAuthURL(
      this.filterPostInfo.url,
    );

    return await this.fetchFilter();
  }

  async synchronise(recentHistory: Set<string>) {
    const postData = await this.aquireLock();

    if (postData.updatedAt < this._updatedAt && recentHistory.size === 0) {
      // nothing to sync
      return;
    }

    const filter = this.initFilter();
    filter.load(postData);

    if (recentHistory.size !== 0) {
      recentHistory.forEach(url => {
        filter.put(url);
      });

      await this.edit({
        ...filter.export(),
        lockedAt: null,
        updatedAt: Date.now(),
      });
    }

    return filter;
  }

  private async findFilter() {
    let after: string | null;

    do {
      const submissionsData = await this.redditAPI.getSubmissions(
        this.username,
      );
      after = submissionsData.after;

      const postData = submissionsData.submissions.find(
        s =>
          s.author === this.username &&
          s.title === `BloomSync: ${this.filterType}`,
      );

      if (postData) {
        return postData;
      }
    } while (after !== null);
  }

  private async makePost() {
    return await this.redditAPI.submit(
      `u_${this.username}`,
      `BloomSync: ${this.filterType}`,
      '',
    );
  }

  private async aquireLock() {
    const filterData = await this.fetchFilter();

    if (Number.isInteger(filterData.lockedAt)) {
      throw new Error('Locked', { cause: 'locked' });
    }

    return await this.edit({ ...filterData, lockedAt: Date.now() });
  }

  private async fetchFilter(): Promise<WithSync> {
    const postData = await this.redditAPI.getSubmission(
      this.filterPostInfo.url,
    );

    return JSON.parse(postData.selftext || '{}');
  }

  private async edit(content: WithSync): Promise<WithSync> {
    const editResult = await this.redditAPI.edit(
      this.filterPostInfo.name,
      JSON.stringify(content),
    );

    return JSON.parse(editResult.selftext || '{}');
  }
}
