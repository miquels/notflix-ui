const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Home.vue') },
      { path: '/tv-shows/:collection/:name', component: () => import('pages/TvShow.vue') },
      { path: '/tv-shows/', component: () => import('pages/TvShows.vue') },
      { path: '/movies/:collection/:name', component: () => import('pages/Movie.vue') },
      { path: '/movies/', component: () => import('pages/Movies.vue') },
      { path: '/local-player/', component: () => import('pages/LocalPlayer.vue') },
      { path: '/ios-player/', component: () => import('pages/IosPlayer.vue') },
      { path: '/settings/', component: () => import('pages/Settings.vue') },
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
