import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: (state) => ({ config: state.config, favorites: state.favorites }),
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
      isFavorite: (state) => (value) => {
        const key = `${value.collection}.${value.name}`;
        return typeof state.favorites[key] === 'object';
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

      // Add an item as favorite.
      // value is { collection: 'coll', item: 'name' }
      addFavorite(state, value) {
        const key = `${value.collection}.${value.name}`;
        console.log('addFavorite', key);
        state.favorites[key] = {};
      },

      // Remove an item as favorite.
      removeFavorite(state, value) {
        const key = `${value.collection}.${value.name}`;
        console.log('removeFavorite', key);
        delete state.favorites[key];
      },
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
