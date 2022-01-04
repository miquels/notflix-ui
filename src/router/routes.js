const routes = [
  {
    path: '/',
    component: () => import('layouts/Notflix.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: '/tv-shows/', component: () => import('pages/TvShows.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
