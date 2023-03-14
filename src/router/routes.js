const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', exact: true, redirect: '/home/' },
      { path: 'home/', component: () => import('pages/Home.vue') },
      {
        path: 'tv-shows/',
        children: [
          {
            path: ':collection/:name/:details*',
            component: () => import('pages/TvShow.vue'),
            name: 'tvshow',
          },
          {
            path: '',
            component: () => import('pages/TvShows.vue'),
          }
        ],
      },
      {
        path: 'movies/',
        children: [
          {
            path: ':collection/:name',
            component: () => import('pages/Movie.vue'),
          },
          {
            path: '',
            component: () => import('pages/Movies.vue'),
          },
        ],
      },
      { path: 'local-player/', component: () => import('pages/LocalPlayer.vue') },
      { path: 'ios-player/', component: () => import('pages/IosPlayer.vue') },
      { path: 'settings/', component: () => import('pages/Settings.vue') },
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
