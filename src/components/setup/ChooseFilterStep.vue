<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { outlinedHelp } from '@quasar/extras/material-icons-outlined';
import { FilterType } from 'app/src-bex/filters/filter';

const emit = defineEmits<{ (e: 'complete'): void }>();

const { bex } = useQuasar();

const filterOption = ref<FilterType>(FilterType.StandardBloomFilter);

const options = [
  { label: 'Bloom Filter (default)', value: FilterType.StandardBloomFilter },
  { label: 'Cuckoo Filter', value: FilterType.CuckooFilter },
];

async function setFilterType() {
  await bex.send('setFilterType', filterOption.value);

  emit('complete');
}
</script>

<template>
  <p>
    Choose a filter
    <QBtn
      href="#/about"
      target="_blank"
      :icon="outlinedHelp"
      size="sm"
      flat
      round
    />
  </p>
  <QOptionGroup
    v-model="filterOption"
    :options="options"
    color="primary"
    class="q-mb-md"
  />
  <div class="row">
    <QBtn color="primary" label="Continue" @click="setFilterType" />
  </div>
</template>
