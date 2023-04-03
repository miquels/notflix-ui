<template>
  <q-page class="flex flex-center">
    <Thumbs
      :items="items"
      :genres="genres"
      class="fit"
      @selectItem="movieClicked"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import Thumbs from 'components/Thumbs.vue';
import { useApi } from '../lib/api.js';
import { whenTrue } from '../lib/util.js';

export default defineComponent({
  name: 'PageMovies',
  components: {
    Thumbs,
  },

  setup() {
    const emitter = inject('emitter');
    const store = useStore();
    const api = useApi();
    const items = ref([]);
    const genres = ref([]);

    // FIXME: collection id is hardcoded here.
    const collection = '1';

    const isReady = ref(false);
    emitter.emit('progress', true);

    api.getItems(collection).then((theItems) => {
      items.value = [...theItems];
      isReady.value = true;
    });
    api.getGenreNames(collection).then((theGenres) => {
      genres.value = theGenres;
      if (store.state.currentView.type === 'movies') {
        store.commit('currentView', { genres: theGenres });
      }
    });

    onActivated(() => {
      console.log('Movies onactivated');
      store.commit('currentView', { type: 'movies', genres: genres.value });
    });

    onMounted(() => {
      console.log('Movies: mounted');
      whenTrue(isReady, () => {
        console.log('Movies: schedule stop progress bar');
        nextTick(emitter.emit('progress', false));
      });
    });

    return {
      collection,
      items,
      genres,
      store,
    };
  },

  methods: {
    movieClicked(item) {
      this.$router.push(`/movies/${item.collection}/${item.id}`);
    },
  },
});
</script>
