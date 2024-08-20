// Modified from template provided by Quasar Framework
// https://quasar.dev/

import { bexBackground } from 'quasar/wrappers';
import { StorageHandler } from './utils/storage';
import { HistoryHandler } from './utils/historyHandler';
import { FilterType } from './filters/filter';

chrome.runtime.onInstalled.addListener(async () => {
  await Promise.allSettled([
    chrome.storage.local.clear(),
    chrome.alarms.clearAll(),
  ]);

  chrome.tabs.create({
    url: chrome.runtime.getURL('www/index.html#/welcome'),
  });
});

declare module '@quasar/app-vite' {
  interface BexEventMap {
    setSyncKey: [string, boolean];
    setFilterType: [FilterType, boolean];
    setupCompleted: [never, boolean];
  }
}

const storage = new StorageHandler();
const historyHandler = new HistoryHandler(storage);

const currentPageInfo = { url: '', hasVisited: false };

const SYNC_ALARM_KEY = 'sync-alarm';

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

/**
 * Setup the alarms for periodically syncing the filter.
 *
 * Assumes HistoryHandler has been initialised.
 */
async function setupAlarm() {
  const alarm = await chrome.alarms.get(SYNC_ALARM_KEY);

  if (alarm === undefined) {
    chrome.alarms.create(SYNC_ALARM_KEY, {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });
  }

  if (chrome.alarms.onAlarm.hasListener(onAlarm)) {
    return;
  }

  chrome.alarms.onAlarm.addListener(onAlarm);
}

async function onAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name !== SYNC_ALARM_KEY) {
    return;
  }

  await historyHandler.synchronise();

  // not sure if alarms will fire after the browser has been closed,
  // in case it does, remove the listener
  const tabs = await chrome.tabs.query({});
  if (tabs.length !== 0) {
    return;
  }

  chrome.alarms.onAlarm.removeListener(onAlarm);
}

initHistoryHandler()
  .then(setupAlarm)
  .catch((error: Error) => {
    if (error.cause === 'sync_key_missing') {
      return;
    }

    throw error;
  });

function validateCurrentURL(url: string) {
  // historyHandler might not have been initialised (e.g. if onboarding is not completed yet)
  if (!historyHandler.isInitialised) {
    return;
  }

  // ignore non-http pages (e.g. chrome://)
  if (!url.startsWith('http')) {
    return;
  }

  return url;
}

function onTabUpdated(url: string | undefined) {
  // if url was not changed, it will be undefined
  if (!url) {
    return;
  }

  const validatedURL = validateCurrentURL(url);
  if (!validatedURL) {
    chrome.action.setIcon({
      path: iconPaths('default'),
    });

    return;
  }

  const hasVisited = historyHandler.get(validatedURL);

  currentPageInfo.url = validatedURL;
  currentPageInfo.hasVisited = hasVisited;

  chrome.action.setIcon({
    path: iconPaths(hasVisited ? 'visited' : 'not-visited'),
  });
}

async function getCurrentTab() {
  return (await chrome.tabs.query({ currentWindow: true, active: true }))[0];
}

// update filter & icon when user navigates to a different page
// uses tabs.onUpdated instead of webNavigation because not all changes to URL
// will send out a request (e.g. searchParams, hash, SPA in browser router)
chrome.tabs.onUpdated.addListener((_tabID, { url }) => {
  onTabUpdated(url);
});

// update filter & icon when user switches to another tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tabInfo = await chrome.tabs.get(tabId);
  onTabUpdated(tabInfo.url);
});

chrome.action.onClicked.addListener(async () => {
  const activeTab = await getCurrentTab();

  if (!activeTab.url) {
    return;
  }

  const currentURL = validateCurrentURL(activeTab.url);
  if (!currentURL || currentURL !== currentPageInfo.url) {
    return;
  }

  const query = new URLSearchParams({
    url: currentURL,
    hasVisited: currentPageInfo.hasVisited ? '1' : '0',
  });

  await chrome.action.setPopup({
    popup: chrome.runtime.getURL(`www/index.html#/popup?${query}`),
  });

  await chrome.action.openPopup();

  await chrome.action.setPopup({ popup: '' });
});

export default bexBackground(async (bridge /* , allActiveConnections */) => {
  const currentTab = await getCurrentTab();

  if (currentTab.url?.includes(chrome.runtime.id)) {
    bridge.on('setSyncKey', async ({ data, respond }) => {
      await storage.set('syncKey', data);
      respond(true);
    });

    bridge.on('setFilterType', async ({ data, respond }) => {
      await storage.set('filterType', data);
      respond(true);
    });

    bridge.on('setupCompleted', async ({ respond }) => {
      try {
        await initHistoryHandler();
        await setupAlarm();

        respond(true);
      } catch (e) {
        respond(false);
        throw e;
      }
    });
  }
});
