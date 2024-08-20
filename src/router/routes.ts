// Modified from template provided by Quasar Framework
// https://quasar.dev/

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: { name: 'notFound' } },
      { path: 'about', component: () => import('pages/AboutPage.vue') },
    ],
  },

  {
    path: '/welcome',
    children: [
      { path: '', component: () => import('pages/WelcomePage.vue') },
      {
        path: 'setup',
        name: 'setup',
        component: () => import('pages/SetupPage.vue'),
      },
    ],
  },

  // popup
  {
    path: '/popup',
    component: () => import('layouts/PopupLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/PopupIndex.vue'),
        name: 'popupIndex',
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'notFound',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
