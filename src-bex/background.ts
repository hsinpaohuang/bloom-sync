import { bexBackground } from 'quasar/wrappers';
import { RedditAPI, Status } from './utils/RedditAPI';
import { StorageHandler } from './utils/storage';
import { HistoryHandler } from './historyHandler';

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.clear();

  chrome.tabs.create({
    url: chrome.runtime.getURL('www/index.html#/welcome'),
  });
});

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
    setupCompleted: [never, boolean];
  }
}

const storage = new StorageHandler();
const redditAPI = new RedditAPI(storage);
const historyHandler = new HistoryHandler(storage);

function iconPaths(type: 'default' | 'visited' | 'not-visited') {
  const formattedType = type === 'default' ? '' : `-${type}`;

  return {
    16: `icons/icon${formattedType}-16x16.png`,
    48: `icons/icon${formattedType}-48x48.png`,
    128: `icons/icon${formattedType}-128x128.png`,
  };
}

async function initHistoryHandler() {
  const syncKey = await storage.get('syncKey');

  if (syncKey === undefined) {
    throw new Error('Sync key not found in storage', {
      cause: 'sync_key_missing',
    });
  }

  await historyHandler.init();
}

initHistoryHandler().catch((error: Error) => {
  if (error.cause === 'sync_key_missing') {
    return;
  }

  throw error;
});

function onNavigation(_tabId: number, { url }: chrome.tabs.TabChangeInfo) {
  // historyHandler might not have been initialised (e.g. if onboarding is not completed yet)
  if (!historyHandler.isInitialised) {
    return;
  }

  // if url was not changed, it will be undefined
  if (!url) {
    return;
  }

  // ignore non-http requests (e.g. chrome://)
  if (!url.startsWith('http')) {
    chrome.action.setIcon({
      path: iconPaths('default'),
    });
    return;
  }

  // change icon
  const isInHistory = historyHandler.get(url);
  chrome.action.setIcon({
    path: iconPaths(isInHistory ? 'visited' : 'not-visited'),
  });
}

chrome.tabs.onUpdated.addListener(onNavigation);

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

    bridge.on('setupCompleted', async ({ respond }) => {
      try {
        await initHistoryHandler();
        respond(true);
      } catch (e) {
        respond(false);
        throw e;
      }
    });
  }
});
