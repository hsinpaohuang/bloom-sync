import MurmurHash from 'imurmurhash';
import type { Filter } from './filter';

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
  private seeds: number[];

  constructor(size = 60_000, maxItems = 1_336, syncKey: string) {
    this.bitArray = [];
    this.size = size;
    this.maxItems = maxItems;
    this.seeds = this.initialiseSeeds(syncKey);
  }

  put(text: string, cache: number[] = []) {
    if (this.numItems > this.maxItems) {
      throw new Error('Bloom filter is full', { cause: 'bloom_filter_full' });
    }

    this.seeds.forEach((seed, index) => {
      if (index < cache.length) {
        this.bitArray[cache[index]] = 1;
        return;
      }

      const bitArrIndex = this.hash(text, seed);
      this.bitArray[bitArrIndex] = 1;
    });

    this.numItems++;
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
    return new MurmurHash(text, seed).result() % this.size;
  }

  private initialiseSeeds(key: string) {
    const seedCharWithIndex = Array.from(key).map(
      (char, index) => `${index}_${char}`,
    );
    const hash = new MurmurHash();

    return seedCharWithIndex.map(char => {
      hash.reset();
      return hash.hash(char).result();
    });
  }
}
