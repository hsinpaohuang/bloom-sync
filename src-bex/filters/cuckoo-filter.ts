import { Filter } from './filter';
import { Bucket } from '../utils/bucket';
import Murmurhash from 'imurmurhash';

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

export class CuckooFilter implements Filter<[number, string]> {
  private capacity: number;
  private count = 0;
  private bucketSize;
  private fingerprintSize: number;
  private maxKicks: number;
  private buckets: Bucket[] = [];
  private seed: number;

  constructor(
    capacity: number,
    errorRate = 0.000_000_1,
    bucketSize = 4,
    maxKicks = 500,
    syncKey: string,
  ) {
    this.capacity = capacity;
    this.bucketSize = bucketSize;
    this.fingerprintSize = Math.ceil(
      Math.log2(1 / errorRate) + Math.log2(2 * bucketSize),
    );
    this.maxKicks = maxKicks;
    this.seed = this.initialiseSeed(syncKey);
  }

  put(_text: string, cache: Readonly<[number, string]> = [0, '']) {
    // debugger;
    const firstIndex = cache[0];
    let fingerprint = cache[1];
    const secondIndex = (firstIndex ^ this.hash(fingerprint)) % this.capacity;

    const firstPutResult = this.putToBucket(firstIndex, fingerprint);
    if (firstPutResult) {
      this.count++;
      return true;
    }

    // bucket at first index is full, try the second one
    const secondPutResult = this.putToBucket(secondIndex, fingerprint);
    if (secondPutResult) {
      this.count++;
      return true;
    }

    // buckets at both indices are full,
    // attempt to kick random fingerprints to different locations
    const log: Array<[number, string]> = [];
    let index = Math.random() < 0.5 ? firstIndex : secondIndex;
    for (let i = 0; i < this.maxKicks; i++) {
      fingerprint = this.buckets[index].swap(fingerprint);
      index = (index ^ this.hash(fingerprint)) % this.capacity;
      log.push([index, fingerprint]);

      const retryResult = this.putToBucket(index, fingerprint);
      if (retryResult) {
        this.count++;
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
    // debugger;
    const firstIndex = this.hash(text) % this.capacity;
    const fingerprint = this.fingerprint(firstIndex);

    return {
      result: this.buckets.some(b => b.get(fingerprint)),
      cache: [firstIndex, fingerprint] as const,
    };
  }

  delete(_text: string) {
    throw new Error('Not implemented');
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
}
