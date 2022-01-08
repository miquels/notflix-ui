import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store(() => {
  const Store = createStore({

    state: () => ({
      castState: 'no_devices',
      castActive: false,
      config: {
        useHls: true,
      },
    }),

    /*
    actions: {
      nextSong( { commit, state } ){
        let nextIndex = state.activeIndex + 1;

        commit( 'setActiveIndex', nextIndex );
        commit( 'setActiveSong', state.songs[ nextIndex ] );
      }
    },
    */

    mutations: {
      castState(state, cast) {
        state.castState = cast;
        if (cast !== 'connected') {
          state.castActive = false;
        }
      },
      castActive(state, active) {
        state.castActive = active;
      },
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
