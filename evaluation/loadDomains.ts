import path from 'path';
import { parseFile } from 'fast-csv';

export async function loadDomains() {
  return new Promise<string[]>((resolve, reject) => {
    const domains: string[] = [];

    const csvPath = path.join(import.meta.dirname, 'domains.csv');

    parseFile(csvPath, { headers: true })
      .on('data', ({ domain }) => {
        domains.push(domain);
      })
      .on('error', error => {
        reject(error);
      })
      .on('end', () => {
        resolve(domains);
      });
  });
}
