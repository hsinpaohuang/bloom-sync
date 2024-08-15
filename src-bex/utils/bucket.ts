/*
 * Reference:
 * B. Fan, D. Andersen, M. Kaminsky, M. Mitzenmacher, and I. Labs, “Cuckoo Filter:
 * Practically Better Than Bloom,” Proceedings of the 10th ACM International on
 * Conference on emerging Networking Experiments and Technologies (CoNEXT ’14), pp.
 * 75–88, Dec. 2014, doi: https://doi.org/10.1145/2674005.2674994.
 *
 * Adapeted from:
 * Callidon/bloom-filters
 * https://github.com/Callidon/bloom-filters/blob/master/src/cuckoo/bucket.ts
 * Accessed 05 Aug. 2024
 *
 * huydhn/cuckoo-filter
 * https://github.com/huydhn/cuckoo-filter/blob/master/cuckoo/bucket.py
 * Accessed 05 Aug. 2024
 */

export class Bucket {
  private size: number;
  private _bucket: Array<string> = [];

  constructor(size: number = 4) {
    this.size = size;
  }

  get bucket(): Readonly<string[]> {
    return Object.freeze(this.bucket);
  }

  private get isFull() {
    return this._bucket.length > this.size;
  }

  // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  private get randomIndex() {
    return Math.floor(Math.random() * this.size - 1);
  }

  put(fingerprint: string) {
    if (this.isFull) {
      return false;
    }

    this._bucket.push(fingerprint);
    return true;
  }

  get(fingerprint: string) {
    return this._bucket.includes(fingerprint);
  }

  delete(fingerprint: string) {
    const index = this._bucket.indexOf(fingerprint);
    if (index === -1) {
      return false;
    }

    this._bucket.splice(index, 1);
    return true;
  }

  swap(fingerprint: string) {
    const index = this.randomIndex;

    const output = this._bucket[index];
    this._bucket[index] = fingerprint;

    return output;
  }

  replace(from: string, to: string) {
    const index = this._bucket.indexOf(from);

    if (index === -1) {
      return false;
    }

    this._bucket[index] = to;

    return true;
  }

  load(items: Readonly<string[]>) {
    this._bucket = [...items];
  }
}
