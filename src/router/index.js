import { route } from 'quasar/wrappers';
import { nextTick } from 'vue';
import {
  createRouter, createMemoryHistory, createWebHistory, createWebHashHistory,
} from 'vue-router';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

var historyPosition = 0;
var blocked = false;

export default route((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);
  // Leave this as is and make changes in quasar.conf.js instead!
  // quasar.conf.js -> build -> vueRouterMode
  // quasar.conf.js -> build -> publicPath
  const ssr = process.env.MODE === 'ssr';
  const history = createHistory(ssr ? void 0 : process.env.VUE_ROUTER_BASE);

  const Router = createRouter({
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition;
      }
      return { x: 0, y: 0 };
    },
    routes,
    history,
  });

  // We want to prevent the user from using the 'back' button on
  // the root level.
  //
  // The below beforeEach and afterEach work together to snoop on the
  // "position" member of the history.state object. This way, we can
  // detect if the "back" button was pressed.
  //
  // Yes, we are depending on vue-router internals and that is bad.
  Router.afterEach((to, from) => {
    if (!blocked) {
      historyPosition = window.history.state.position;
    }
    blocked = false;
  });

  Router.beforeEach((to, from) => {
    if (window.history.state.position === historyPosition - 1) {
      if (from.meta.isRoot) {
        // console.log('BLOCKED');
        blocked = true;
        return false;
      }
    }
  });

  return Router;
});
