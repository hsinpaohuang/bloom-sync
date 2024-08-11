import type { RouteRecordRaw } from 'vue-router';

function checkOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');

  return state?.startsWith('reddit_') ? { name: 'redditOAuth' } : undefined;
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },

  {
    path: '/welcome',
    children: [
      { path: '', component: () => import('pages/WelcomePage.vue') },
      {
        path: 'setup',
        name: 'setup',
        component: () => import('pages/SetupPage.vue'),
        children: [
          {
            path: 'new',
            name: 'newUserSetup',
            component: () => import('components/setup/NewUserSetup.vue'),
          },
          {
            path: 'returning',
            name: 'returningUserSetup',
            component: () => import('components/setup/ReturningUserSetup.vue'),
          },
        ],
      },
    ],
  },

  // OAuth routes
  {
    path: '/oauth',
    children: [
      {
        path: 'reddit',
        name: 'redditOAuth',
        component: () => import('components/oauth/RedditOAuthHander.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    beforeEnter: checkOAuthRedirect,
  },
];

export default routes;
