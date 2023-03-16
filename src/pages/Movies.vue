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
import { useApi } from '../lib/api.js';

export default defineComponent({
  name: 'PageMovies',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const api = useApi();
    const items = ref([]);
    const genres = ref([]);

    // FIXME: collection id is hardcoded here.
    const collection = '1';

    api.getItems(collection).then((theItems) => {
      items.value = [...theItems];
    });
    api.getGenreNames(collection).then((theGenres) => {
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
      collection,
      items,
      genres,
      store,
    };
  },

  methods: {
    movie_clicked(movieName) {
      this.$router.push(`/movies/${this.collection}/${movieName}`);
    },
  },
});
</script>
