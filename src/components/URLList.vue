<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';

const { bex } = useQuasar();
const browsingHistory = ref<string[]>([]);
onBeforeMount(async () => {
  browsingHistory.value = (await bex.send('getHistory')).data;
});
</script>

<template>
  <div>
    <h3>History:</h3>
    <ul>
      <li v-for="(url, index) in browsingHistory" :key="index">
        {{ url }}
      </li>
    </ul>
  </div>
</template>
