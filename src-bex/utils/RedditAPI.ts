import { StorageHandler } from './storage';

export enum Status {
  Rejected = 'rejected',
  Failed = 'failed',
  Completed = 'completed',
}

export type RedditAuth = {
  accessToken: string;
  expireAt: number;
  refreshToken: string;
};

type AccessTokenResponse = {
  access_token: string;
  expires_in: number; // seconds
  refresh_token: string;
  scope: string;
  token_type: 'bearer';
};

type Submission = {
  title: string;
  name: string; // kind & id, format: kind_id
  author: string;
  selftext: string;
  url: string;
};

type GetSubmissionReponse =
  | [{ data: { children: [Submission] } }]
  | { message: string; error: number };

type SubmissionListing = {
  data: {
    after: string | null;
    children: { data: Submission }[];
  };
};

type SubmitResponse = {
  json: { errors: string[]; data: { url: string; name: string } };
};

type EditResponse = {
  json: { errors: string[]; data: { things: [{ data: Submission }] } };
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

  private static readonly defaultParams = new URLSearchParams({
    raw_json: '1',
  });

  private state = '';

  private accessToken = '';

  private refreshToken = '';

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
      scope: 'identity read submit edit',
    });

    return `${RedditAPI.BASE_URL}/api/v1/authorize?${params}`;
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

    await this.storageHandler.set('redditAuth', {
      accessToken,
      refreshToken,
      expireAt: this.expireAt,
    });

    return refreshToken;
  }

  async getMe(): Promise<string> {
    await this.refreshAccessToken();

    const response = await fetch(
      `${RedditAPI.OAUTH_BASE_URL}/api/v1/me?${RedditAPI.defaultParams}`,
      this.OAuthConfig,
    );
    const data = await response.json();

    return String(data.name);
  }

  async getSubmission(url: string) {
    await this.refreshAccessToken();

    const response = await fetch(
      `${url}.json?${RedditAPI.defaultParams}`,
      this.OAuthConfig,
    );
    const responseData = (await response.json()) as GetSubmissionReponse;

    if (!Array.isArray(responseData)) {
      throw new Error('Failed to get submission', {
        cause: responseData.message,
      });
    }

    return responseData[0].data.children[0];
  }

  async getSubmissions(username: string, after?: string) {
    await this.refreshAccessToken();

    const params = new URLSearchParams(RedditAPI.defaultParams);
    if (after !== undefined) {
      params.append('after', after);
    }

    const response = await fetch(
      `${RedditAPI.OAUTH_BASE_URL}/r/u_${username}?${params}`,
      this.OAuthConfig,
    );

    const { data } = (await response.json()) as SubmissionListing;

    return { submissions: data.children.map(s => s.data), after: data.after };
  }

  async submit(subreddit: string, title: string, content: string) {
    await this.refreshAccessToken();

    const body = new FormData();
    body.append('sr', subreddit);
    body.append('kind', 'self');
    body.append('title', title);
    body.append('text', content);
    body.append('api_type', 'json');

    const response = await fetch(`${RedditAPI.OAUTH_BASE_URL}/api/submit`, {
      method: 'POST',
      body,
      ...this.OAuthConfig,
    });

    const { json } = (await response.json()) as SubmitResponse;

    if (!json?.data?.url || !json.data.name) {
      throw new Error('Failed to submit', { cause: 'submission_failed' });
    }

    const { url, name } = json.data;

    return { url, name };
  }

  async edit(name: string, content: string) {
    await this.refreshAccessToken();

    const body = new FormData();
    body.append('api_type', 'json');
    body.append('text', content);
    body.append('thing_id', name);

    const response = await fetch(
      `${RedditAPI.OAUTH_BASE_URL}/api/editusertext`,
      { method: 'POST', body, ...this.OAuthConfig },
    );

    const { json: responseData } = (await response.json()) as EditResponse;

    if (responseData.errors.length) {
      throw new Error('Failed to edit post', {
        cause: responseData.errors.join(', '),
      });
    }

    return responseData.data.things[0].data;
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      const redditAuth = await this.storageHandler.get('redditAuth');

      if (!redditAuth) {
        throw new Error('refreshToken is not defined', {
          cause: 'missing_refresh_token',
        });
      }

      this.accessToken = redditAuth.accessToken;
      this.expireAt = redditAuth.expireAt;
      this.refreshToken = redditAuth.refreshToken;
    }

    const isTokenExpired = this.expireAt - Date.now() < 1000; // 1 second of buffer

    if (this.accessToken && !isTokenExpired) {
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

  /**
   * Formats the given URL to the OAuth URL
   *
   * The URL returned by reddit API is using the normal origin
   * (www.reddit.com) and not the OAuth origin (oauth.reddit.com).
   *
   * Without using the OAuth origin, accessing some things will result in 403,
   * so we need to format the URL with the OAuth origin.
   *
   * @param normalURL the URL to be formatted
   * @returns the formatted URL
   */
  static convertToOAuthURL(normalURL: string) {
    if (normalURL.startsWith(RedditAPI.OAUTH_BASE_URL)) {
      return normalURL;
    }

    const url = new URL(normalURL);
    return `${RedditAPI.OAUTH_BASE_URL}/${url.pathname}`;
  }
}
