/**
 * Calculates the optimal number of bits to use in a bloom filter
 *
 * Adapted from:
 * Hurst, Thomas, "Bloom Filter Calculator"
 * https://hur.st/bloomfilter/bloomfilter.js
 * Accessed 23 Aug. 2024
 */

export function calcBloomFilterSize(
  n: number, // number of items
  p: number, // false positive rate
  k: number, // number of hash functions
) {
  const r = -k / Math.log(1 - Math.exp(Math.log(p) / k));

  return Math.ceil(r * n);
}
