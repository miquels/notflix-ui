import { decodeSE } from '../lib/util.js';

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
        beforeEnter: (to) => {
          // If seasonEpisode param is present check it.
          if (to.params &&
              to.params.seasonEpisode &&
              !decodeSE(to.params.seasonEpisode)) {
            return {
              name: '404',
              replace: true,
            }
          }
        },
        children: [
          {
            path: ':collection/:name/:seasonEpisode/play',
            component: () => import('pages/Player.vue'),
            name: 'tvshow-play',
            exact: true,
          },
          {
            path: ':collection/:name/:seasonEpisode?',
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
  {
    // Explicit not found for redirect / replace.
    name: '404',
    path: '/404',
    component: () => import('pages/Error404.vue'),
  },
  {
    // Catchall not found.
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
