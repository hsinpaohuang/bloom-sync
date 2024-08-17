import Murmurhash from 'imurmurhash';
import { Filter } from './filter';
import { Bucket } from '../utils/bucket';

type SerialisedFilter = { [index: string]: Readonly<string[]> };

export type CFData = {
  filter: SerialisedFilter;
  numItems: number;
  maxItems: number;
  fingerprintSize: number;
  bucketSize: number;
  maxKicks: number;
};

/*
 * Reference:
 * B. Fan, D. Andersen, M. Kaminsky, M. Mitzenmacher, and I. Labs, “Cuckoo Filter:
 * Practically Better Than Bloom,” Proceedings of the 10th ACM International on
 * Conference on emerging Networking Experiments and Technologies (CoNEXT ’14), pp.
 * 75–88, Dec. 2014, doi: https://doi.org/10.1145/2674005.2674994.
 *
 * Adapted from:
 * Callidon/bloom-filters
 * https://github.com/Callidon/bloom-filters/blob/master/src/cuckoo/cuckoo-filter.ts
 * Accessed 05 Aug. 2024
 *
 * huydhn/cuckoo-filter
 * https://github.com/huydhn/cuckoo-filter/blob/master/cuckoo/filter.py
 * Accessed 05 Aug. 2024
 */

export class CuckooFilter implements Filter<CFData> {
  private maxItems: number;
  private numItems = 0;
  private bucketSize;
  private fingerprintSize: number;
  private maxKicks: number;
  private buckets: Bucket[] = [];
  private seed: number;

  constructor(
    syncKey: string,
    maxItems: number,
    errorRate = 10e-7,
    bucketSize = 4,
    maxKicks = 500,
  ) {
    this.seed = this.initialiseSeed(syncKey);
    this.maxItems = maxItems;
    this.bucketSize = bucketSize;
    this.fingerprintSize = Math.ceil(
      Math.log2(1 / errorRate) + Math.log2(2 * bucketSize),
    );
    this.maxKicks = maxKicks;
  }

  put(text: string) {
    if (this.numItems > this.maxItems) {
      throw new Error('Cuckoo Filter is full', { cause: 'cuckoo_filter_full' });
    }

    const firstIndex = this.hash(text) % this.maxItems;
    let fingerprint = this.fingerprint(firstIndex);
    const secondIndex = (firstIndex ^ this.hash(fingerprint)) % this.maxItems;

    const firstPutResult = this.putToBucket(firstIndex, fingerprint);
    if (firstPutResult) {
      this.numItems++;
      return true;
    }

    // bucket at first index is full, try the second one
    const secondPutResult = this.putToBucket(secondIndex, fingerprint);
    if (secondPutResult) {
      this.numItems++;
      return true;
    }

    // buckets at both indices are full,
    // attempt to kick random fingerprints to different locations
    const log: Array<[number, string]> = [];
    let index = Math.random() < 0.5 ? firstIndex : secondIndex;
    for (let i = 0; i < this.maxKicks; i++) {
      fingerprint = this.buckets[index].swap(fingerprint);
      index = (index ^ this.hash(fingerprint)) % this.maxItems;
      log.push([index, fingerprint]);

      const retryResult = this.putToBucket(index, fingerprint);
      if (retryResult) {
        this.numItems++;
        return true;
      }
    }

    // max kick reached, rollback all kicks
    for (let i = 0; i < log.length - 1; i++) {
      // looping through `log`, so `pop` should never be undefined
      [index, fingerprint] = log.pop()!;
      // same with `at`
      const replaceResult = this.buckets[index].replace(
        log.at(-1)![1],
        fingerprint,
      );

      if (!replaceResult) {
        throw new Error(
          'An unexpected error occurred during the rollback process.',
        );
      }
    }

    return false;
  }

  get(text: string) {
    const firstIndex = this.hash(text) % this.maxItems;
    const fingerprint = this.fingerprint(firstIndex);

    return this.buckets.some(b => b.get(fingerprint));
  }

  delete(_text: string) {
    throw new Error('Not implemented');
  }

  export() {
    const { numItems, maxItems, fingerprintSize, bucketSize, maxKicks } = this;

    return {
      filter: CuckooFilter.serialise(this.buckets),
      numItems,
      maxItems,
      fingerprintSize,
      bucketSize,
      maxKicks,
    };
  }

  load({
    filter,
    numItems,
    maxItems,
    fingerprintSize,
    bucketSize,
    maxKicks,
  }: Partial<CFData>) {
    if (filter) {
      this.buckets = CuckooFilter.deserialise(filter);
    }

    if (numItems) {
      this.numItems = numItems;
    }

    if (maxItems) {
      this.maxItems = maxItems;
    }

    if (fingerprintSize) {
      this.fingerprintSize = fingerprintSize;
    }

    if (bucketSize) {
      this.bucketSize = bucketSize;
    }

    if (maxKicks) {
      this.maxKicks = maxKicks;
    }
  }

  private hash(text: string) {
    return new Murmurhash(text, this.seed).result();
  }

  private fingerprint(hash: number) {
    return String(hash).slice(0, this.fingerprintSize);
  }

  private putToBucket(index: number, fingerprint: string) {
    if (this.buckets[index] === undefined) {
      this.buckets[index] = new Bucket(this.bucketSize);
    }

    return this.buckets[index].put(fingerprint);
  }

  private initialiseSeed(key: string) {
    return new Murmurhash(key).result();
  }

  private static serialise(buckets: Bucket[]) {
    return buckets.reduce<SerialisedFilter>((acc, curr, index) => {
      if (!curr) {
        return acc;
      }

      acc[index] = curr.bucket;

      return acc;
    }, {});
  }

  private static deserialise(serialisedFilter: SerialisedFilter) {
    const buckets: Bucket[] = [];
    Object.entries(serialisedFilter).forEach(([idx, bucketData]) => {
      const bucket = new Bucket();
      bucket.load(bucketData);
      const index = Number.parseInt(idx);
      buckets[index] = bucket;
    });

    return buckets;
  }
}
