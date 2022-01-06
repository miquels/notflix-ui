export default {
  state: () => ({
    castState: 'no_devices',
    castActive: false,
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
    },
  },

  /*
  getters: {
    getCastState(state) {
      return state.cast;
    },
  },
  */
};
