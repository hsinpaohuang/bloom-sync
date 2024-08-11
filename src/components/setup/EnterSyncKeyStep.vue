<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar, type QInput } from 'quasar';

const emit = defineEmits<{ (e: 'complete'): void }>();

const { bex } = useQuasar();

const key = ref('');
const inputRef = ref<QInput | null>(null);

async function onFinishInput() {
  if (!inputRef.value?.validate()) {
    return;
  }

  await bex.send('setSyncKey', key.value);
  emit('complete');
}

const rules = [
  (val: string) =>
    val.length === 36 ||
    'The length of the key must be 36 characters, including dashes',
];
</script>

<template>
  <div class="col">
    <p>Please enter your sync key:</p>
    <div class="row q-gutter-x-md">
      <QInput
        ref="inputRef"
        v-model="key"
        :rules
        outlined
        lazy-rules
        class="key-input"
        @keydown.enter.self="onFinishInput"
      />
      <QBtn
        color="primary"
        icon="keyboard_return"
        label="Enter"
        class="q-mb-lg"
        @click="onFinishInput"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.key-input {
  flex: 1;
  :deep(input) {
    min-width: 36ch; // length of randomUUID
  }
}
</style>
