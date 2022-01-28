import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: (state) => ({ config: state.config }),
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
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
