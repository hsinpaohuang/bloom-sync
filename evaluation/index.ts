import { writeToPath } from 'fast-csv';
import { loadDomains } from './loadDomains';
import { Filter } from '../src-bex/filters/filter';
import { StandardBloomFilter } from '../src-bex/filters/bloom-filter';
import { CuckooFilter } from '../src-bex/filters/cuckoo-filter';
import { calcBloomFilterSize } from './bloomFilterCalculator';
import path from 'path';

if (!process.env.RUN) {
  throw new Error('Please specify a run number with RUN=number');
}

const domains = await loadDomains();

function run(pickedDomains: string[], remains: string[], filter: Filter) {
  const insertDuration = pickedDomains.reduce((duration, domain) => {
    const start = performance.now();
    filter.put(domain);
    const end = performance.now();

    return duration + (end - start);
  }, 0);
  const insertionThroughput = pickedDomains.length / insertDuration;

  const notInFilters = remains.slice(0, pickedDomains.length);

  const lookupDomains = notInFilters.concat(pickedDomains);

  const lookupResults = lookupDomains.reduce(
    (acc, domain) => {
      const start = performance.now();
      const get = filter.get(domain);
      const duration = performance.now() - start;
      acc.duration += duration;

      if (!pickedDomains.includes(domain) && get) {
        acc.fpCount++;
      }

      return acc;
    },
    { fpCount: 0, duration: 0 },
  );

  const falsePositiveRate = lookupResults.fpCount / notInFilters.length;

  const lookupThroughput = lookupDomains.length / lookupResults.duration;

  const data = filter.export();
  const exportSize = new Blob([JSON.stringify(data.filter)]).size;

  console.log(
    `${filter.constructor.name}:
  insert throughput: ${insertionThroughput} items/ms,
  lookup throughput: ${lookupThroughput} items/ms,
  number of false positives: ${lookupResults.fpCount} (${falsePositiveRate.toFixed(3)}%),
  exported filter size: ${exportSize} bytes`,
  );

  return {
    name: filter.constructor.name,
    insertionThroughput,
    lookupThroughput,
    falsePositiveRate,
    exportedFilterSize: exportSize,
  };
}

const key = globalThis.crypto.randomUUID();

const numItems = [10_000, 50_000, 100_000];
const filterOccupancies = [0.2, 0.4, 0.6, 0.8, 1.0];

function pick<T>(arr: T[], count: number) {
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  const picked = shuffled.splice(0, count);

  return { picked, remains: shuffled };
}

const bfResults: Array<Record<string, unknown>> = [
  {
    numItem: 'numItems',
    occupancy: 'occupancy',
    name: 'name',
    insertionThroughput: 'insertionThroughput',
    lookupThroughput: 'lookupThroughput',
    falsePositiveRate: 'falsePositiveRate',
    exportedFilterSize: 'exportedFilterSize',
  },
];
const cfResults: Array<Record<string, unknown>> = [
  {
    numItem: 'numItems',
    occupancy: 'occupancy',
    name: 'name',
    insertionThroughput: 'insertionThroughput',
    lookupThroughput: 'lookupThroughput',
    falsePositiveRate: 'falsePositiveRate',
    exportedFilterSize: 'exportedFilterSize',
  },
];

numItems.forEach(numItem => {
  console.log(`number of URLs: ${numItem}`);
  filterOccupancies.forEach(occupancy => {
    console.log(`filter occupancy: ${occupancy}`);

    const numItemWithOccupancy = Math.round(numItem * occupancy);
    const { picked, remains } = pick(domains, numItemWithOccupancy);

    const bloomFilterSize = calcBloomFilterSize(numItem, 1e-7, 18);

    bfResults.push({
      numItem: numItemWithOccupancy,
      occupancy,
      ...run(
        picked,
        remains,
        new StandardBloomFilter(key, bloomFilterSize, numItem),
      ),
    });

    cfResults.push({
      numItem: numItemWithOccupancy,
      occupancy,
      ...run(picked, remains, new CuckooFilter(key, numItem, 1e-7)),
    });

    console.log('');
  });
});

const bfPath = path.join(
  import.meta.dirname,
  'results',
  `BloomFilter_run#${process.env.RUN}.csv`,
);

const cfPath = path.join(
  import.meta.dirname,
  'results',
  `CuckooFilter_run#${process.env.RUN}.csv`,
);

await Promise.all([
  writeToPath(bfPath, bfResults),
  writeToPath(cfPath, cfResults),
]);
