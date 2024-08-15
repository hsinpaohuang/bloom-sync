import { bexBackground } from 'quasar/wrappers';
import { RedditAPI, Status } from './utils/RedditAPI';
import { StorageHandler } from './utils/storage';

chrome.runtime.onInstalled.addListener(() =>
  chrome.tabs.create({
    url: chrome.runtime.getURL('www/index.html#/welcome'),
  }),
);

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('www/index.html') });
});

type AuthoriseResult =
  | { success: true }
  | { success: false; error: { message: string; cause: unknown } };

declare module '@quasar/app-vite' {
  interface BexEventMap {
    getAuthURL: [never, string];
    authorise: [
      { status: Status; code: string; state: string },
      AuthoriseResult,
    ];
    setSyncKey: [string, boolean];
  }
}

const storage = new StorageHandler();
const redditAPI = new RedditAPI(storage);

function onNavigation({
  frameType,
  url,
}: chrome.webNavigation.WebNavigationFramedCallbackDetails) {
  // ignore iframes
  if (frameType !== 'outermost_frame') {
    return;
  }

  // ignore non-http requests (e.g. chrome://)
  if (!url.startsWith('http')) {
    return;
  }

  // console.time('[BloomFilter] get');
  // const { result: bfIsInHistory, cache: bfCache } = bloomFilter.get(url);
  // console.timeEnd('[BloomFilter] get');
  // if (bfIsInHistory) {
  //   console.log(`[BloomFilter] visited: ${url}`);
  // } else {
  //   console.log(`[BloomFilter] not visited: ${url}`);

  //   console.time('[BloomFilter] put');
  //   bloomFilter.put(url, bfCache);
  //   console.timeEnd('[BloomFilter] put');
  // }

  // console.time('[CuckooFilter] get');
  // const { result: cfIsInHistory, cache: cfCache } = cuckooFilter.get(url);
  // console.timeEnd('[CuckooFilter] get');
  // if (cfIsInHistory) {
  //   console.log(`[CuckooFilter] visited: ${url}`);
  // } else {
  //   console.log(`[CuckooFilter] not visited: ${url}`);

  //   console.time('[CuckooFilter] put');
  //   cuckooFilter.put(url, cfCache);
  //   console.timeEnd('[CuckooFilter] put');
  // }
}

chrome.webNavigation.onCompleted.addListener(onNavigation);

export default bexBackground(async (bridge /* , allActiveConnections */) => {
  const currentTab = (
    await chrome.tabs.query({ currentWindow: true, active: true })
  )[0];
  if (currentTab.url?.includes(chrome.runtime.id)) {
    bridge.on('setSyncKey', async ({ data, respond }) => {
      await storage.set('syncKey', data);
      respond(true);
    });
    bridge.on('getAuthURL', ({ respond }) => {
      respond(redditAPI.authURL);
    });
    bridge.on('authorise', async ({ data, respond }) => {
      const { status, code, state } = data;
      try {
        await redditAPI.authorise(status, code, state);
        respond({ success: true });
      } catch (e) {
        const { message, cause } = e as Error;
        respond({ success: false, error: { message, cause } });
      }
    });
  }
});
