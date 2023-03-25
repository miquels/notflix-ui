<template>
  <q-page class="flex flex-center">
    <div v-if="haveFavorites === false" class="text-body1">
      You have not selected any favorites yet. Click on the TV-SHOWS tab to get started.
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
    const collection = '2';

    function getItems() {
      api.getItems(collection).then((theItems) => {
        // console.log('setting items', theItems);
        // eslint-disable-next-line
        items.value = theItems.filter((item) => api.isFavorite(item.id));
        haveFavorites.value = items.value.length > 0;
        console.log('haveFavorites', haveFavorites.value);
      });
    }
    getItems();

    api.getGenreNames(collection).then((theGenres) => {
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
      collection,
      genres,
      haveFavorites,
      items,
      store,
    };
  },

  methods: {
    show_clicked(showName) {
      // console.log('clicked on', showName);
      this.$router.push(`/tv-shows/${this.collection}/${showName}`);
    },
  },
});
</script>
