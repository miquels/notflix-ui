<template>
  <q-page class="flex flex-center">
    <Thumbs
      :items="items"
      :genres="genres"
      class="fit"
      @selectItem="movie_clicked"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
  onActivated,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import Thumbs from 'components/Thumbs.vue';
import API from '../lib/api.js';

export default defineComponent({
  name: 'PageMovies',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const items = ref([]);
    const genres = ref([]);
    const api = new API();

    api.getItems('Movies').then((theItems) => {
      // Sort by last added.
      const sortItems = [...theItems];
      sortItems.sort((a, b) => b.lastvideo - a.lastvideo);
      items.value = sortItems;
    });
    api.getGenreNames('Movies').then((theGenres) => {
      genres.value = theGenres;
      if (store.state.currentView.type === 'movies') {
        store.commit('currentView', { genres: theGenres });
      }
    });

    onActivated(() => {
      // console.log('movies onactivated');
      store.commit('currentView', { type: 'movies', genres: genres.value });
    });

    return {
      items,
      genres,
      store,
    };
  },

  methods: {
    movie_clicked(movieName) {
      this.$router.push(`/movies/Movies/${movieName}`);
    },
  },
});
</script>
