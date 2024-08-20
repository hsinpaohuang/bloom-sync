<script setup lang="ts">
// Modified from template provided by Quasar Framework
// https://quasar.dev/

import logoWhiteURL from 'assets/bloom-sync-logo-white.png';
</script>

<template>
  <QLayout view="lHh Lpr lFf">
    <QHeader elevated>
      <QToolbar>
        <QAvatar size="md">
          <img :src="logoWhiteURL" />
        </QAvatar>
        <QToolbarTitle>BloomSync</QToolbarTitle>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <RouterView />
    </QPageContainer>
  </QLayout>
</template>
