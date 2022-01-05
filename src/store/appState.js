export default {
  state: () => ({
    cast: 'no_devices',
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
    setCastState(state, cast) {
      state.cast = cast;
    },
  },

  getters: {
    getCastState(state) {
      return state.cast;
    },
  },
};
