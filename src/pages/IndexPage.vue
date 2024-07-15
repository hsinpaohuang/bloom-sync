<template>
  <q-page class="row items-center justify-evenly">
    <URLList />
  </q-page>
</template>

<script setup lang="ts">
import URLList from 'components/URLList.vue';

defineOptions({
  name: 'IndexPage',
});
</script>
