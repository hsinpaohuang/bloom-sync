import { bexBackground } from 'quasar/wrappers';
import { StandardBloomFilter } from './filters/bloom-filter';
import { CuckooFilter } from './filters/cuckoo-filter';

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

const bloomFilter = new StandardBloomFilter();
const cuckooFilter = new CuckooFilter(10_000);

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

  console.time('[BloomFilter] get');
  const { result: bfIsInHistory, cache: bfCache } = bloomFilter.get(url);
  console.timeEnd('[BloomFilter] get');
  if (bfIsInHistory) {
    console.log(`[BloomFilter] visited: ${url}`);
  } else {
    console.log(`[BloomFilter] not visited: ${url}`);

    console.time('[BloomFilter] put');
    bloomFilter.put(url, bfCache);
    console.timeEnd('[BloomFilter] put');
  }

  console.time('[CuckooFilter] get');
  const { result: cfIsInHistory, cache: cfCache } = cuckooFilter.get(url);
  console.timeEnd('[CuckooFilter] get');
  if (cfIsInHistory) {
    console.log(`[CuckooFilter] visited: ${url}`);
  } else {
    console.log(`[CuckooFilter] not visited: ${url}`);

    console.time('[CuckooFilter] put');
    cuckooFilter.put(url, cfCache);
    console.timeEnd('[CuckooFilter] put');
  }
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
