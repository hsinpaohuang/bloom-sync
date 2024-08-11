<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

const shouldAskForSyncKey = computed(() => route.name === 'setup');
</script>

<template>
  <div class="column justify-center items-center window-height">
    <h1 class="text-h2 q-mb-none">Setup</h1>

    <div v-if="shouldAskForSyncKey" class="q-mb-auto">
      <h3 class="text-h4">Do you have a sync key?</h3>
      <div class="row justify-center items-center q-gutter-md">
        <QBtn :to="{ name: 'returningUserSetup' }" color="secondary">Yes</QBtn>
        <QBtn :to="{ name: 'newUserSetup' }" color="primary">No</QBtn>
      </div>
    </div>

    <div v-else class="q-mt-lg q-mb-auto">
      <RouterView />
    </div>
  </div>
</template>
