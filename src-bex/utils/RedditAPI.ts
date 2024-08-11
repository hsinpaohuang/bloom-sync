import { StorageHandler } from './storage';

export enum Status {
  Rejected = 'rejected',
  Failed = 'failed',
  Completed = 'completed',
}

type AccessTokenResponse = {
  access_token: string;
  expires_in: number; // seconds
  refresh_token: string;
  scope: string;
  token_type: 'bearer';
};

type RefreshTokenResponse = Omit<AccessTokenResponse, 'refresh_token'>;

if (process.env.CLIENT_ID === undefined) {
  throw new Error('missing client ID');
}
const CLIENT_ID = process.env.CLIENT_ID;

export class RedditAPI {
  private static readonly BASE_URL = 'https://www.reddit.com';

  private static readonly OAUTH_BASE_URL = 'https://oauth.reddit.com';

  private static readonly REDIRECT_URI =
    'chrome-extension://agfdbjfmdmkgembmliioljbfoolmhikj/www/index.html';

  private static readonly authHeaders = {
    Authorization: `Basic ${globalThis.btoa(`${CLIENT_ID}:`)}`,
  };

  private static readonly defaultParams = { raw_json: 1 };

  private state = '';

  private accessToken = '';

  private _refreshToken = '';

  private expireAt = 0; // milliseconds since Unix epoch

  private storageHandler: StorageHandler;

  constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler;
  }

  get authURL(): string {
    this.state = `reddit_${globalThis.crypto.randomUUID()}`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      state: this.state,
      redirect_uri: RedditAPI.REDIRECT_URI,
      duration: 'permanent',
      scope: 'read submit',
    });

    return `${RedditAPI.BASE_URL}/api/v1/authorize?${params}`;
  }

  private get refreshToken() {
    return this._refreshToken;
  }

  private set refreshToken(token: string) {
    this._refreshToken = token;
    this.storageHandler.set('redditRefreshToken', token);
  }

  private get OAuthConfig() {
    if (!this.accessToken) {
      throw new Error('accessToken is not defined', {
        cause: 'missing_access_token',
      });
    }

    return { headers: { Authorization: `Bearer ${this.accessToken}` } };
  }

  async authorise(
    status: Status,
    code: string,
    state: string,
  ): Promise<string> {
    switch (status) {
      case Status.Rejected:
        throw new Error('Authorisation Canceled', { cause: 'auth_canceled' });
      case Status.Failed:
        throw new Error('Authorisation Failed');
    }

    if (state !== this.state) {
      throw new Error('state is not equal', { cause: 'state_mismatch' });
    }

    const response = await fetch(`${RedditAPI.BASE_URL}/api/v1/access_token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: RedditAPI.REDIRECT_URI,
      }),
      headers: RedditAPI.authHeaders,
    });
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = (await response.json()) as AccessTokenResponse;

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expireAt = Date.now() + expiresIn * 1000;

    return refreshToken;
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('refreshToken is not defined', {
        cause: 'missing_refresh_token',
      });
    }

    const isTokenExpired = Date.now() - this.expireAt < 1000; // 1 second of buffer

    if (this.accessToken || !isTokenExpired) {
      return;
    }

    const response = await fetch(`${RedditAPI.BASE_URL}/api/v1/access_token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
      headers: RedditAPI.authHeaders,
    });
    const { access_token: accessToken, expires_in: expiresIn } =
      (await response.json()) as RefreshTokenResponse;

    this.accessToken = accessToken;
    this.expireAt = Date.now() + expiresIn * 1000;
  }
}
