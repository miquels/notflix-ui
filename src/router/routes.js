const routes = [
  {
    path: '/',
    component: () => import('layouts/Notflix.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: '/tv-shows/:collection/:name', component: () => import('pages/TvShow.vue') },
      { path: '/tv-shows/', component: () => import('pages/TvShows.vue') },
      { path: '/local-player/:src', component: () => import('pages/LocalPlayer.vue') },
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
