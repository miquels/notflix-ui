<template>
  <q-page class="flex flex-center">
    <div v-if="haveFavorites === false" class="text-h6">
      You have not selected any favorites yet. Click on the TV-SHOWS tab to get started.
    </div>
    <div v-if="haveFavorites === true" class="text-h6">
      &gt;&gt;
      This listing of favorites is preliminary and subject to change!
      Your settings will be lost!
      &lt;&lt;
    </div>
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
  name: 'PageHome',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const items = ref([]);
    const genres = ref([]);
    const api = new API();
    const collection = 'TV Shows';
    const haveFavorites = ref(null);

    api.getItems(encodeURIComponent(collection)).then((theItems) => {
      // console.log('setting items', theItems);
      // eslint-disable-next-line
      items.value = theItems.filter((item) => store.getters.isFavorite({ collection, name: item.name }));
      haveFavorites.value = items.value.length > 0;
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
      haveFavorites,
    };
  },

  methods: {
    show_clicked(showName) {
      // console.log('clicked on', showName);
      this.$router.push(`/tv-shows/TV Shows/${showName}`);
    },
  },
});
</script>
