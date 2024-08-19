<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QStepper } from 'quasar';
import { matKey, matStorage, matCheck } from '@quasar/extras/material-icons';
import SyncKeyGenerationStep from './SyncKeyGenerationStep.vue';
import ChooseFilterStep from './ChooseFilterStep.vue';
import SetupCompleteStep from './SetupCompleteStep.vue';

const router = useRouter();
const { bex, notify } = useQuasar();

const step = ref(0);
const stepper = ref<InstanceType<typeof QStepper> | null>(null);

const isLoading = ref(false);

async function onGoBack() {
  switch (step.value) {
    case 0:
      router.push({ name: 'setup' });
      break;
    case 2:
      isLoading.value = true;
      const { data: success } = await bex.send('setupCompleted');
      if (!success) {
        notify({
          message: 'Sorry, something went wrong. Please try again later',
          color: 'negative',
        });

        isLoading.value = false;

        return;
      }

      window.close();
      break;
    default:
      stepper.value?.previous();
  }
}

const navLabel = computed(() => (step.value === 2 ? 'Finish' : 'Back'));
</script>

<template>
  <QStepper ref="stepper" v-model="step" class="stepper w-80vw" animated>
    <QStep
      :name="0"
      :done="step > 0"
      :icon="matKey"
      :active-icon="matKey"
      title="Sync Key Generation"
    >
      <SyncKeyGenerationStep @complete="stepper?.next" />
    </QStep>

    <QStep
      :name="1"
      :done="step > 1"
      :icon="matStorage"
      :active-icon="matStorage"
      title="Choose a filter"
    >
      <ChooseFilterStep @complete="stepper?.next" />
    </QStep>

    <QStep
      :name="2"
      :done="step > 2"
      :icon="matCheck"
      :active-icon="matCheck"
      title="All set"
    >
      <SetupCompleteStep>
        Your browsing history will now be automatically synchronised.
        <br />
        Install this extension on another browser to synchronise the browsing
        history of both browsers.
      </SetupCompleteStep>
    </QStep>

    <template #navigation>
      <QStepperNavigation>
        <QBtn
          color="primary"
          :label="navLabel"
          :loading="isLoading"
          @click="onGoBack"
        />
      </QStepperNavigation>
    </template>
  </QStepper>
</template>

<style scoped>
.stepper {
  width: 80vw;
}
</style>
