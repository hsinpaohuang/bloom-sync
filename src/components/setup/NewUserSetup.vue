<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { QStepper } from 'quasar';
import SyncKeyGenerationStep from './SyncKeyGenerationStep.vue';
import RedditAuthStep from './RedditAuthStep.vue';
import SetupCompleteStep from './SetupCompleteStep.vue';

const router = useRouter();

const step = ref(0);
const stepper = ref<InstanceType<typeof QStepper> | null>(null);

function onGoBack() {
  switch (step.value) {
    case 0:
      router.push({ name: 'setup' });
      break;
    case 2:
      window.close();
      break;
    default:
      stepper.value?.previous();
  }
}

const navLabel = computed(() => (step.value === 2 ? 'Close' : 'Back'));
</script>

<template>
  <QStepper ref="stepper" v-model="step" class="stepper w-80vw" animated>
    <QStep
      :name="0"
      :done="step > 0"
      icon="key"
      active-icon="key"
      title="Sync Key Generation"
    >
      <SyncKeyGenerationStep @complete="stepper?.next" />
    </QStep>

    <QStep
      :name="1"
      :done="step > 1"
      icon="login"
      active-icon="login"
      title="Log in with your Reddit account"
    >
      <RedditAuthStep @complete="stepper?.next">
        <p>
          We'll use your Reddit account to synchronise your browsing history by
          posting the "filter" in a post.
          <!-- TODO: add links to explaining how bloom filter & cuckoo filter work -->
          <br />
          (Don't worry, without the sync key, nobody can read your browsing
          history.)
        </p>
      </RedditAuthStep>
    </QStep>

    <QStep
      :name="2"
      :done="step > 2"
      icon="check"
      active-icon="check"
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
        <QBtn color="primary" :label="navLabel" @click="onGoBack" />
      </QStepperNavigation>
    </template>
  </QStepper>
</template>

<style scoped>
.stepper {
  width: 80vw;
}
</style>
