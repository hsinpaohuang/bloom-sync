import MurmurHash from 'imurmurhash';
import utf8 from 'utf8';
import type { Filter } from './filter';

export type SBFData = {
  filter: string; // encoded
  numItems: number;
  size: number;
  maxItems: number;
};

/*
 * Reference:
 * B. H. Bloom, “Space/time trade-offs in hash coding with allowable errors,”
 * Communications of the ACM, vol. 13, no. 7, pp. 422–426, Jul. 1970, doi:
 * https://doi.org/10.1145/362686.362692
 */

export class StandardBloomFilter implements Filter<SBFData, number[]> {
  private bitArray: number[];
  private size: number;
  private numItems = 0;
  private maxItems: number;
  private seeds: number[];

  // The utf8 library doesn't support all utf-16 strings,
  // therefore, we limit BITS_PER_CHUNK to 8 to avoid errors
  private static BITS_PER_CHUNK = 8 as const;

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

  export() {
    const { numItems, size, maxItems } = this;
    return {
      filter: StandardBloomFilter.encode(this.bitArray),
      numItems,
      size,
      maxItems,
    };
  }

  load({ filter, numItems, size, maxItems }: SBFData) {
    this.bitArray = StandardBloomFilter.decode(filter, this.size);
    this.numItems = numItems;
    this.size = size;
    this.maxItems = maxItems;
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

  private static encode(bitArray: number[]) {
    // divide the bitArray into 8 bit chunks, then encode each chunk using utf-8
    const numChunks = Math.ceil(
      bitArray.length / StandardBloomFilter.BITS_PER_CHUNK,
    );

    let buffer = '';

    for (let i = 0; i < numChunks; i++) {
      const chunk = bitArray.slice(
        i * StandardBloomFilter.BITS_PER_CHUNK,
        (i + 1) * StandardBloomFilter.BITS_PER_CHUNK,
      );
      const binaryString = chunk.join('');
      const decimal = Number.parseInt(binaryString, 2);
      buffer += String.fromCharCode(decimal);
    }

    // use utf-8 to encode the bitArray to ensure compatibility
    return utf8.encode(buffer);
  }

  private static decode(encodedBitArray: string, size: number) {
    const decoded = utf8.decode(encodedBitArray).split('');

    return decoded.reduce<number[]>((acc, curr, index, arr) => {
      const decimal = curr.charCodeAt(0);
      const binaryString = decimal.toString(2);
      const chunk = binaryString.split('').map(Number);

      // add padding to make sure each chunk is exactly 8 bits except for the last one,
      // which needs fill the remaining length of the original bitArray
      const paddingLength =
        index === arr.length - 1
          ? size - acc.length - chunk.length
          : StandardBloomFilter.BITS_PER_CHUNK - chunk.length;

      const padding = Array(paddingLength).fill(0);
      acc.push(...padding, ...chunk);

      return acc;
    }, []);
  }
}
