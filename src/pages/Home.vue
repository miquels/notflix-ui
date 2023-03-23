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

    // FIXME: hardcoded collection.
    const collection = '2';

    function getItems() {
      api.getItems(collection).then((theItems) => {
        // console.log('setting items', theItems);
        // eslint-disable-next-line
        items.value = theItems.filter((item) => api.isFavorite(item.id));
      });
    }
    getItems();

    api.getGenreNames(collection).then((theGenres) => {
      genres.value = theGenres;
      if (store.state.currentView.type === 'series') {
        store.commit('currentView', { genres: theGenres });
      }
    });

    console.log('api.apiLastUpdate is', api.apiLastUpdate);
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
      store,
      items,
      genres,
      collection,
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
