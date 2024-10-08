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

export class StandardBloomFilter implements Filter<SBFData> {
  private bitArray: number[];
  private size: number;
  private numItems = 0;
  private maxItems: number;
  private seeds: number[];

  // The utf8 library doesn't support all utf-16 strings,
  // therefore, we limit BITS_PER_CHUNK to 8 to avoid errors
  private static BITS_PER_CHUNK = 8 as const;

  // In utf-8 encoding, many characters between 0 ~ 161 are controls,
  // which will be escaped by JSON.stringify when encoding.
  // From 161 to 417 is a range of 256 characters that are not controls, which
  // works better for efficient encoding and coverting between utf8 and utf16
  private static STARTING_CODE = 161;

  constructor(syncKey: string, size: number, maxItems: number) {
    this.seeds = this.initialiseSeeds(syncKey);
    this.bitArray = Array(size).fill(0);
    this.size = size;
    this.maxItems = maxItems;
  }

  put(text: string) {
    if (this.numItems > this.maxItems) {
      throw new Error('Bloom filter is full', { cause: 'bloom_filter_full' });
    }

    this.seeds.forEach(seed => {
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
        return false;
      }
    }

    return true;
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

  load({ filter, numItems, size, maxItems }: Partial<SBFData>) {
    if (filter) {
      this.bitArray = StandardBloomFilter.decode(filter, this.size);
    }

    if (numItems) {
      this.numItems = numItems;
    }

    if (size) {
      this.size = size;
    }

    if (maxItems) {
      this.maxItems = maxItems;
    }
  }

  private hash(text: string, seed: number) {
    return new MurmurHash(text, seed).result() % this.size;
  }

  private initialiseSeeds(key: string) {
    // slice the 36 characters key into 18 chunks of 2 character strings
    // reference: https://stackoverflow.com/a/7033662
    const slicedKey = key.match(/.{1,2}/g);
    if (slicedKey === null) {
      throw new Error('Invalid Sync Key', { cause: 'sync_key_invalid' });
    }

    const seedCharWithIndex = slicedKey.map(
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
      buffer += String.fromCharCode(
        decimal + StandardBloomFilter.STARTING_CODE,
      );
    }

    return utf8.encode(buffer);
  }

  private static decode(encodedBitArray: string, size: number) {
    const decoded = utf8.decode(encodedBitArray).split('');

    return decoded.reduce<number[]>((acc, curr, index, arr) => {
      const decimal = curr.charCodeAt(0);
      const binaryString = (
        decimal - StandardBloomFilter.STARTING_CODE
      ).toString(2);
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
