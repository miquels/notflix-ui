import { decodeSE } from '../lib/util.js';

var fromRoute;

const routes = [
  {
    path: '/',
    redirect: { path: '/home', query: null },
  },
  {
    path: '/home',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'home',
        path: '',
        component: () => import('pages/Home.vue')
      },
    ],
  },
  {
    path: '/tv-shows',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'tvshow-play',
        path: ':collection/:id/:seasonEpisode/play',
        component: () => import('pages/Player.vue'),
      },
      {
        name: 'tvshow',
        path: '/tv-shows/:collection/:id/:seasonEpisode?',
        component: () => import('pages/TvShow.vue'),
        props: () => ({ fromRoute }),
        beforeEnter: (to, from) => {
          fromRoute = from;
        },
      },
      {
        name: 'tvshows',
        path: '',
        component: () => import('pages/TvShows.vue'),
        name: 'tvshows',
      }
    ],
  },
  {
    path: '/movies/:collection/:id/play',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'movie-play',
        path: '',
        component: () => import('pages/Player.vue'),
        exact: true,
      },
    ],
  },
  {
    path: '/movies/:collection/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'movie',
        path: '',
        component: () => import('pages/Movie.vue'),
      },
    ],
  },
  {
    path: '/movies',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'movies',
        path: '',
        component: () => import('pages/Movies.vue'),
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'settings',
        path: '',
        component: () => import('pages/Settings.vue'),
      },
    ],
  },
  {
    path: '/404',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: '404',
        path: '',
        component: () => import('pages/Error404.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: '404-catchall',
        path: '',
        component: () => import('pages/Error404.vue'),
      },
    ],
  },
];

export default routes;
