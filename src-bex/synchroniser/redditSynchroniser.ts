import type { Filter, FilterType } from '../filters/filter';
import type { RedditAPI } from '../utils/RedditAPI';
import type { Synchroniser } from './synchroniser';

type WithLock<T = Record<string, unknown>> = T & { lockedAt: number | null };

export class RedditSynchroniser<T extends Filter> implements Synchroniser<T> {
  private redditAPI: RedditAPI;

  private filterType: string;

  private initFilter: () => T;

  private username = '';

  private filterPostInfo = { url: '', name: '' };

  constructor(
    reditAPI: RedditAPI,
    filterType: FilterType,
    initFilter: () => T,
  ) {
    this.redditAPI = reditAPI;
    this.filterType = filterType;
    this.initFilter = initFilter;
  }

  async init(): Promise<WithLock> {
    this.username = await this.redditAPI.getMe();
    const filterPost = await this.findFilter();

    if (filterPost) {
      this.filterPostInfo = { url: filterPost.url, name: filterPost.name };
      return JSON.parse(filterPost.selftext);
    }

    this.filterPostInfo = await this.makePost();
    return await this.fetchFilter();
  }

  async synchronise(recentHistory: Set<string>) {
    const postData = await this.aquireLock();

    const filter = this.initFilter();
    filter.load(postData);

    recentHistory.forEach(url => {
      filter.put(url);
    });

    await this.edit({ ...filter.export(), lockedAt: null });

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

    if (filterData.lockedAt !== null) {
      throw new Error('Locked', { cause: 'locked' });
    }

    return await this.edit({ ...filterData, lockedAt: Date.now() });
  }

  private async fetchFilter(): Promise<WithLock> {
    const postData = await this.redditAPI.getSubmission(
      this.filterPostInfo.url,
    );

    return JSON.parse(postData.selftext);
  }

  private async edit(content: WithLock): Promise<WithLock> {
    const editResult = await this.redditAPI.edit(
      this.filterPostInfo.name,
      JSON.stringify(content),
    );

    return JSON.parse(editResult.selftext);
  }
}
