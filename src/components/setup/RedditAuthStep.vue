<script setup lang="ts">
import { useRedditAuth } from 'src/composables/useRedditAuth';

const emit = defineEmits<{ (e: 'complete'): void }>();

const { initRedditAuth, isWaitingRedditAuth, isRedditAuthCompleted } =
  useRedditAuth();

async function onClickRedditAuth() {
  await initRedditAuth();

  if (isRedditAuthCompleted.value) {
    emit('complete');
  }
}
</script>

<template>
  <slot></slot>
  <QBtn
    v-if="!isRedditAuthCompleted"
    icon-right="open_in_new"
    class="reddit-button"
    label="Log in with your Reddit account"
    :loading="isWaitingRedditAuth"
    :disable="isWaitingRedditAuth"
    @click="onClickRedditAuth"
  />
  <QBtn v-else icon="done" color="positive" disable />
</template>

<style scoped>
.reddit-button {
  color: white;

  /*
   * Reddit OrangeRed
   * reference: https://www.redditinc.com/assets/images/site/reddit_brand_guidelines_version_2022_2022-04-01-160548_akmi.pdf
   */
  background-color: #ff4500;
}
</style>
