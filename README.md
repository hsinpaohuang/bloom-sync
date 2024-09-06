# BloomSync (bloom-sync)

A cross-browser history synchronisation browser extension

## Mirrors

A mirror of this code base can be found on [GitHub](https://github.com/hsinpaohuang/bloom-sync)

The branch `prototype` contains code for a prototype, which records the URLs the user has visited.

Ths branch `main` contains the code for the browser extension.

The branch `evaluation` contains the script which evaluates the perfomances of Bloom filter and Cuckoo filter, as well as the results.

## Installing the extension

Currently, the extension has only been tested on Chromium-based browsers. It does not currently work on Firefox. See this [bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=1573659) for more details.

To install the extension on a Chromium-based browser, follow these steps:

1. Navigate your browser to `chrome://extensions`
2. Enable `Developer Mode`
3. Click on `Load Unpacked`
4. The compiled file should be under `dist/bex`, so select it as the folder to open
   - Alternatively, the compiled file can be downloaded [here](https://github.com/hsinpaohuang/bloom-sync/releases/latest)
5. The extension should now be installed

## Development Guide

### Install the dependencies

```bash
bun i
```

### Install Quasar CLI

```bash
bun i -g @quasar/cli
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
bun dev
```

### Build the app for production

```bash
bun run build
```
