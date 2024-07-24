import { bexBackground } from 'quasar/wrappers';
import { StandardBloomFilter } from './filters/bloom-filter';

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

// declare module '@quasar/app-vite' {
//   interface BexEventMap {
//   }
// }

const browsingHistory = new StandardBloomFilter();

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

  console.time('check');
  const { result: isInHistory, cache } = browsingHistory.get(url);
  console.timeEnd('check');
  if (isInHistory) {
    console.log('[BloomTwitter] visited');
    return;
  }

  console.log('[BloomTwitter] not visited');
  browsingHistory.put(url, cache);
}

export default bexBackground((_bridge /* , allActiveConnections */) => {
  // avoid attaching duplicate listeners every time the user opens a tab
  const hasNavListener =
    chrome.webNavigation.onCompleted.hasListener(onNavigation);
  if (hasNavListener) {
    return;
  }

  chrome.webNavigation.onCompleted.addListener(onNavigation);
});
