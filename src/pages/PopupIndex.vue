<script setup lang="ts">
import { computed } from 'vue';
import { outlinedHelp } from '@quasar/extras/material-icons-outlined';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

if (route.query.url === null || route.query.hasVisited === null) {
  router.push({ name: 'notFound' });
}

// todo: replace placeholder
const currentPageData = computed(() => ({
  url: route.query.url as string,
  hasVisited: route.query.hasVisited === '1',
}));

console.log(route.query, currentPageData.value);

const urlHost = computed(() => new URL(currentPageData.value.url).host);

const iconProps = computed(() =>
  currentPageData.value.hasVisited
    ? { name: 'check_circle', color: 'positive' }
    : { name: 'add_circle', color: 'warning' },
);
</script>

<template>
  <div class="column items-center q-gutter-y-md q-pt-md">
    <QExpansionItem
      :label="urlHost"
      class="url"
      header-class="text-center overflow-hidden text-body text-bold"
    >
      <p class="overflow-hidden break-word">
        {{ currentPageData.url }}
      </p>
    </QExpansionItem>
    <QIcon v-bind="iconProps" size="30vw" />
    <p v-if="currentPageData.hasVisited" class="q-px-lg">
      You <i>most likely</i> have visited this page before
      <!-- todo: explain filter -->
      <QBtn :icon="outlinedHelp" size="sm" flat round @click="console.log" />
    </p>
    <div v-else class="q-px-lg q-pb-lg">
      <span>This is the first time you have visited this page</span>
      <br />
      <span>Your browsing history has been updated</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.url {
  width: 80vw;
  :deep(.q-expansion-item__container) {
    .q-item {
      justify-content: center;

      .q-item__section {
        flex: none;
      }

      .q-item__label {
        word-break: break-all;
      }
    }
  }
}

.break-word {
  word-break: break-all;
}
</style>
