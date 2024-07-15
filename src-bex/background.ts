import { bexBackground } from 'quasar/wrappers';

function openExtension() {
  chrome.tabs.create(
    {
      url: chrome.runtime.getURL('www/index.html'),
    },
    (/* newTab */) => {
      // Tab opened.
    },
  );
}

chrome.runtime.onInstalled.addListener(openExtension);
chrome.action.onClicked.addListener(openExtension);

declare module '@quasar/app-vite' {
  interface BexEventMap {
    getHistory: [string[]];
  }
}

const browsingHistory = new Set<string>();

function onNavigation(
  details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
) {
  // ignore iframes
  if (details.frameType !== 'outermost_frame') {
    return;
  }

  // ignore non-http requests (e.g. chrome://)
  if (!details.url.startsWith('http')) {
    return;
  }

  browsingHistory.add(details.url);
}

export default bexBackground((bridge /* , allActiveConnections */) => {
  bridge.on('getHistory', ({ respond }) => {
    respond(Array.from(browsingHistory));
  });

  // avoid attaching duplicate listeners every time the user opens a tab
  const hasNavListener =
    chrome.webNavigation.onCompleted.hasListener(onNavigation);
  if (hasNavListener) {
    return;
  }

  chrome.webNavigation.onCompleted.addListener(onNavigation);
});
