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
      showSearch: false,
      search: '',
      currentVideo: null,
      config: {
        useHls: true,
        castUseShakaHack: true,
        apiUrl: '',
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

    getters: {
      config(state) {
        return state.config;
      },
    },

    mutations: {
      // current Chromecast state (no_devices, not_connected, connected).
      castState(state, cast) {
        state.castState = cast;
        if (cast !== 'connected') {
          state.castActive = false;
        }
      },

      // show the Chromecast bottom bar?
      castActive(state, active) {
        state.castActive = active;
      },

      // search as-we-type.
      search(state, value) {
        state.search = value || '';
      },

      // show 'search' in the menubar?
      showSearch(state, value) {
        state.showSearch = value || false;
      },

      // video currently playing (or about to be played).
      currentVideo(state, value) {
        state.currentVideo = value;
      },

      // config from remote /config.json (if any).
      remoteConfig(state, config) {
        if (config.apiUrl) {
          state.config.apiUrl = config.apiUrl;
        }
      },
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
