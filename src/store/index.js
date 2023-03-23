import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';
import { encodeSE } from '../lib/util.js';

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: (state) => ({
    config: state.config,
    favorites: state.favorites,
    tvshow: state.tvshow,
    movie: state.movie,
  }),
});

export default store(() => {
  const Store = createStore({

    plugins: [
      vuexLocal.plugin,
    ],

    state: () => ({
      castState: 'no_devices',
      castActive: false,
      currentVideo: null,

      // Stored config (for now in localstorage).
      config: {
        // what sort of videostream to request.
        streamingFormat: 'hls',

        // 'notflix', 'default', or a custom receiver id.
        castReceiver: 'notflix',

        // use the native <video> element and controls on ioS.
        iosNativeVideo: true,
      },

      // What shows / movies are marked as 'favorite'.
      favorites: {},

      // Per tv-show info.
      // Each object contains tvshow state:
      //  {
      //    focusSeason: 2,   // last focussed season
      //    focusEpisode: 3,  // last focussed episode
      //    seen: {
      //      's02e01': {
      //        duration: 3600,
      //        currentTime: 700,
      //      },
      //    },
      //  }
      tvshow: {},

      // Per movie info.
      // Each object contains movie state:
      //  {
      //    seen: {
      //      duration: 3600,
      //      currentTime: 700,
      //    },
      //  }
      movie: {},

      // external config loaded from 'config.json' (if present).
      externalConfig: {
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

    getters: {
      config(state) {
        return state.config;
      },

      genres(state) {
        return state.currentView.genres;
      },

      tvshow: (state) => (id) => {
        return state.tvshow[id] || {};
      },

      movie: (state) => (id) => {
        return state.movie[id] || {};
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

      // video currently playing (or about to be played).
      currentVideo(state, value) {
        state.currentVideo = value;
      },

      currentView(state, value) {
        Object.entries(value).forEach(([key, val]) => {
          state.currentView[key] = val;
        });
      },

      // config from remote /config.json (if any).
      externalConfig(state, config) {
        if (config.apiUrl) {
          state.externalConfig.apiUrl = config.apiUrl;
        }
      },

      // cast received id, notflix, default, or custom.
      castReceiver(state, receiver) {
        state.config.castReceiver = receiver;
      },

      // iosNativeVideo.
      iosNativeVideo(state, value) {
        state.config.iosNativeVideo = value;
      },

      // Remember TV Show focus.
      updateTvShowFocus(state, value) {
        if (!state.tvshow[value.id]) {
          state.tvshow[value.id] = {};
        }
        state.tvshow[value.id].focusSeason = value.focusSeason;
        state.tvshow[value.id].focusEpisode = value.focusEpisode;
      },

      // Remove old stuff we don't use anymore
      cleanStore(state) {
        for (let id of Object.keys(state.tvshow)) {
          delete state.tvshow[id].seen;
        }
        for (let id of Object.keys(state.movie)) {
          delete state.movie[id].seen;
        }
        state.favorites = {};
      },
    },
    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
