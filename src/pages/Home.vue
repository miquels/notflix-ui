<template>
  <q-page class="flex flex-center">
    <div v-if="haveFavorites === false" class="text-body1">
      You have not selected any favorites yet. Click on the TV-SHOWS tab to get started.
    </div>
    <Thumbs
      :items="items"
      :genres="genres"
      :favoriteIcons="true"
      type="series"
      class="fit"
      @selectItem="itemClicked"
   />
  </q-page>
</template>

<script>
import {
  defineComponent,
  getCurrentInstance,
  onActivated,
  onDeactivated,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import Thumbs from 'components/Thumbs.vue';
import { useApi } from '../lib/api.js';

export default defineComponent({
  name: 'PageHome',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const api = useApi();
    const items = ref([]);
    const genres = ref([]);
    const haveFavorites = ref(null);

    // FIXME: hardcoded collection.
    const collections = [ '1', '2' ];
    const genreCollection = '2';

    async function getItems() {
      const newItems = [];
      for (let collection of collections) {
        const theItems = await api.getItems(collection);
        newItems.push(...theItems.filter((item) => api.isFavorite(item.id)));
      }
      haveFavorites.value = newItems.length > 0;
      items.value = newItems;
    }
    getItems();

    api.getGenreNames(genreCollection).then((theGenres) => {
      genres.value = theGenres;
      if (store.state.currentView.type === 'series') {
        store.commit('currentView', { genres: theGenres });
      }
    });

    let apiLastUpdate = api.apiLastUpdate();
    onActivated(() => {
      store.commit('currentView', { type: 'series', genres: genres.value });
      if (api.apiLastUpdate() != apiLastUpdate) {
        getItems();
        const instance = getCurrentInstance();
        instance.ctx.$forceUpdate();
      }
    });
    onDeactivated(() => {
      apiLastUpdate = api.apiLastUpdate();
    });

    return {
      api: null,
      genres,
      haveFavorites,
      items,
      store,
    };
  },

  methods: {
    itemClicked(item) {
      console.log('clicked on', item);
      const colltype = item.collection === '1' ? 'movies' : 'tv-shows';
      this.$router.push(`/${colltype}/${item.collection}/${item.id}`);
    },
  },
});
</script>
