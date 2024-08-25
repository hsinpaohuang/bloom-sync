# Evaluating the performance of the filters

`index.ts` in this directory contains the script which measures the insert throughput, lookup throughput, and size of the filters when exported as a string. These are measured with different parameters, such as number of URLs and target occupancy.

URLs in `domains.csv` are retrieved from Cloudflare Radar's top 1 million domains<sup>[1]</sup>.

## Running the benchmarks

Run the following command from the root directory of this repository to run the benchmark:

```bash
RUN=n bun ./evaluation
```

where `n` is the run number that is used to name the output file.

The output will be stored in `evaluation/results`

## References

[1] "Domain Rankings | Cloudflare Radar," Cloudflare Radar, Aug. 19, 2024. Available: [https://radar.cloudflare.com/domains](https://radar.cloudflare.com/domains). [Accessed: Aug. 22, 2024]
