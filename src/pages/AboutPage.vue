<template>
  <div class="q-px-xl text-subtitle1">
    <h1 class="text-center text-h3">About BloomSync</h1>
    <p>
      BloomSync is a browser extension that aims to help users synchronise their
      browsing history across multiple browsers on different devices. Currently,
      most browsers support synchronising browsing history on different devices
      with the same brand (Chrome on PC to Chrome on phone, for example).
      However, they don't support synchronising across different browsers (e.g.,
      Chrome to Firefox).
    </p>
    <p>
      This is where BloomSync comes in. This extension aims to support
      synchronising browsing history across different browsers.
    </p>
    <h2 class="text-center text-h4 q-pt-lg">How does it work?</h2>
    <p>
      BloomSync uses special data structures like Bloom filter<sup>[1]</sup> or
      Cuckoo filter<sup>[2]</sup> to keep track of the URLs you have visited. In
      summary, these probabilistic data structures are very space-efficient,
      allowing BloomSync to store many URLs using very little disk space.
      However, there is one down side of these data structures: they are
      probabilistic, which means, they can produce false positive results (but
      they will not produce false negative results). While BloomSync attempts to
      keep those false positive result to a minimum (1 in 1 million) in rare
      occasions it could still occur.
    </p>
    <h2 class="text-center text-h4 q-pt-lg">Current Status of BloomSync</h2>
    <p>
      Our end goal is to synchronise your browsing history across multiple
      browsers. Currently, BloomSync is still in the proof of concept stage, so
      it only records browsing history and stores it locally in this browser.
    </p>
    <h2 class="text-center text-h4 q-pt-lg">References</h2>
    <p id="ref-1">
      [1] B. H. Bloom, “Space/time trade-offs in hash coding with allowable
      errors,” Communications of the ACM, vol. 13, no. 7, pp. 422–426, Jul.
      1970, doi:
      <a href="https://doi.org/10.1145/362686.362692" target="_blank"
        >https://doi.org/10.1145/362686.362692</a
      >.
    </p>
    <p id="ref-2">
      [2] B. Fan, D. Andersen, M. Kaminsky, M. Mitzenmacher, and I. Labs,
      “Cuckoo Filter: Practically Better Than Bloom,” Proceedings of the 10th
      ACM International on Conference on emerging Networking Experiments and
      Technologies (CoNEXT ’14), pp. 75–88, Dec. 2014, doi:
      <a href="https://doi.org/10.1145/2674005.2674994" target="_blank">
        https://doi.org/10.1145/2674005.2674994</a
      >.
    </p>
  </div>
</template>
