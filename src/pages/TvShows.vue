<template>
  <q-page class="flex flex-center">
    <Thumbs
      :items="items"
      :collection="collection"
      :genres="genres"
      type="series"
      class="fit"
      @selectItem="show_clicked"
   />
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
  name: 'PageTvShows',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const items = ref([]);
    const genres = ref([]);
    const api = new API();

    // FIXME: collection id is hardcoded here.
    const collection = '2';

    api.getItems(encodeURIComponent(collection)).then((theItems) => {
      // console.log('setting items', theItems);
      items.value = theItems;
    });

    api.getGenreNames(encodeURIComponent(collection)).then((theGenres) => {
      genres.value = theGenres;
      if (store.state.currentView.type === 'series') {
        store.commit('currentView', { genres: theGenres });
      }
    });

    onActivated(() => {
      store.commit('currentView', { type: 'series', genres: genres.value });
    });

    return {
      api: null,
      store,
      items,
      genres,
      collection,
    };
  },

  methods: {
    show_clicked(showName) {
      // console.log('clicked on', showName);
      this.$router.push(`/tv-shows/2/${showName}`);
    },
  },
});
</script>
