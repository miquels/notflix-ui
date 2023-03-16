const routes = [
  {
    path: '/',
    exact: true,
    strict: true,
    redirect: '/home/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'home',
        component: () => import('pages/Home.vue')
      },
      {
        path: 'tv-shows',
        children: [
          {
            path: ':collection/:name/:season/:episode/play',
            component: () => import('pages/Player.vue'),
            name: 'tvshow-play',
            exact: true,
          },
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
        path: 'movies',
        children: [
          {
            path: ':collection/:name/play',
            component: () => import('pages/Player.vue'),
            name: 'movie-play',
            exact: true,
          },
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
