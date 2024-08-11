<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

const emit = defineEmits<{ (e: 'complete'): void }>();

const { bex, notify } = useQuasar();

const revealKey = ref(false);

function toggleRevealKey() {
  revealKey.value = !revealKey.value;
}

const generatedKey = window.crypto.randomUUID();
const key = computed(() => (revealKey.value ? generatedKey : '**********'));

async function setSyncKey() {
  await bex.send('setSyncKey', generatedKey);
  emit('complete');
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(generatedKey);
  notify({ message: 'Copied to clipboard', color: 'positive' });
}
</script>

<template>
  <p>
    Let's generate a sync key for you.
    <br />
    You will need to enter this code on other browser if you wish to sync the
    browsing history of that browser.
    <br />
    Do <b>NOT</b> show this code to other people, or else they will be able to
    access your browsing history!
  </p>

  <div class="col q-gutter-y-md q-mt-none">
    <div class="row q-gutter-x-md">
      <QInput
        v-model="key"
        :type="revealKey ? 'text' : 'password'"
        class="key-input"
        outlined
        readonly
      >
        <template #append>
          <QIcon
            :name="revealKey ? 'visibility' : 'visibility_off'"
            class="cursor-pointer"
            @click="toggleRevealKey"
          />
        </template>
      </QInput>

      <QBtn
        color="secondary"
        icon="content_paste"
        label="Copy to clipboard"
        @click="copyToClipboard"
      />
    </div>

    <div class="row">
      <QBtn color="primary" label="Continue" @click="setSyncKey" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.key-input {
  flex: 1;
  :deep(.q-field__control::before) {
    border-style: solid;
  }
  :deep(input) {
    min-width: 36ch; // length of randomUUID
  }
}
</style>
