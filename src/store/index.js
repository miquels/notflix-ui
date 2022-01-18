import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';

export default store(() => {
  const Store = createStore({

    state: () => ({
      castState: 'no_devices',
      castActive: false,
      currentVideo: null,

      filter: {
        showSearch: false,
        search: '',
        filterGenres: [],
        sortBy: null,
      },

      config: {
        useHls: true,
        castUseShakaHack: true,
        apiUrl: '',
      },

      // currentView depends on whether we're in /tv-shows/ or /movies/.
      currentView: {
        // list of unique genres of all content.
        genres: [],
        // 'series' or 'movie'.
        type: null,
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
      genres(state) {
        return state.currentView.genres;
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
        state.filter.search = value || '';
      },

      sortBy(state, value) {
        state.filter.sortBy = value;
      },

      filterGenres(state, value) {
        state.filter.filterGenres = value;
      },

      // show 'search' in the menubar?
      showSearch(state, value) {
        state.filter.showSearch = value || false;
      },

      // video currently playing (or about to be played).
      currentVideo(state, value) {
        state.currentVideo = value;
      },

      currentView(state, value) {
        console.log('update currentView', value);
        Object.entries(value).forEach(([key, val]) => {
          state.currentView[key] = val;
        });
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
