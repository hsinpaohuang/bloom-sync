<script setup lang="ts">
// Modified from template provided by Quasar Framework
// https://quasar.dev/

import logoWhiteURL from 'assets/bloom-sync-logo-white.png';
</script>

<template>
  <QLayout view="lHh Lpr lFf">
    <QHeader elevated>
      <QToolbar>
        <QToolbarTitle
          class="row no-wrap justify-center items-center q-gutter-x-sm text-subtitle1"
        >
          <QAvatar size="md">
            <img :src="logoWhiteURL" />
          </QAvatar>
          <span>BloomSync</span>
        </QToolbarTitle>
      </QToolbar>
    </QHeader>

    <QPageContainer class="window-height">
      <RouterView />
    </QPageContainer>
  </QLayout>
</template>

<style>
html {
  height: 250px;
  width: 300px;
}
</style>
