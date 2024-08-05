import type { Filter } from './filter';
import Murmurhash from 'imurmurhash';

/*
 * Reference:
 * B. H. Bloom, “Space/time trade-offs in hash coding with allowable errors,”
 * Communications of the ACM, vol. 13, no. 7, pp. 422–426, Jul. 1970, doi:
 * https://doi.org/10.1145/362686.362692
 */

export class StandardBloomFilter implements Filter<number[]> {
  private bitArray: number[];
  private size: number;
  private numItems = 0;
  private maxItems: number;

  // todo: seed generation
  private seeds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ];

  constructor(size = 60_000, maxItems = 1_336) {
    this.bitArray = [];
    this.size = size;
    this.maxItems = maxItems;
  }

  put(text: string, cache: number[] = []) {
    this.seeds.forEach((seed, index) => {
      if (index < cache.length) {
        this.bitArray[cache[index]] = 1;
        return;
      }

      const bitArrIndex = this.hash(text, seed);
      this.bitArray[bitArrIndex] = 1;
    });
  }

  get(text: string) {
    const cache: number[] = [];

    for (const seed of this.seeds) {
      const index = this.hash(text, seed);
      cache.push(index);

      if (!this.bitArray[index]) {
        return { result: false, cache };
      }
    }

    return { result: true } as const;
  }

  delete(_: string) {
    throw new Error('Not implemented');
  }

  private hash(text: string, seed: number) {
    return new Murmurhash(text, seed).result() % this.size;
  }
}
