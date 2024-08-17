<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QStepper } from 'quasar';
import RedditAuthStep from './RedditAuthStep.vue';
import SetupCompleteStep from './SetupCompleteStep.vue';
import EnterSyncKeyStep from './EnterSyncKeyStep.vue';

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
      icon="key"
      active-icon="key"
      title="Sync Key"
    >
      <EnterSyncKeyStep @complete="stepper?.next" />
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
          Please login with the same Reddit account you used with the sync key
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
        Your browsing history from other browsers is being loaded to this
        browser.
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
