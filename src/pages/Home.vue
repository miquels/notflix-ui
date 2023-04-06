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
    const tvshowCollection = '2';

    let getItemsTriggeredCount;

    async function getItems() {
      // If we get called while already working, make sure we do another round.
      if (getItemsTriggeredCount > 0) {
        getItemsTriggeredCount = 2;
        return;
      }

      // Loop until we're not triggered anymore.
      getItemsTriggeredCount = 1;
      while (getItemsTriggeredCount > 0) {

        // Loop over all collections and filter out favs.
        const newItems = [];
        for (let collection of collections) {
          let theItems = await api.getItems(collection);
          theItems = theItems.map((i) => structuredClone(i));
          newItems.push(...theItems.filter((item) => api.isFavorite(item.id)));
        }
        haveFavorites.value = newItems.length > 0;
        // items.value = newItems;

        // If this is the final (or only) iteration, get the 'new episodes' count.
        if (getItemsTriggeredCount === 1) {
          const PARALLELISM = 24;

          for (let idx2 = 0; idx2 < newItems.length; idx2 += PARALLELISM) {
            if (getItemsTriggeredCount === 0) {
              break;
            }
            const end = Math.min(newItems.length, idx2 + PARALLELISM);
            const tasks = [];

            for (let idx = idx2; idx < end; idx += 1) {
              const item = newItems[idx];
              if (item.collection !== tvshowCollection) {
                continue;
              }
              tasks.push(api.getShowNewEpisodeCount(item.collection, item.id));
              const results = await Promise.allSettled(tasks);
              for (let result of results) {
                if (result.status === 'rejected') {
                  continue;
                }
                const newEpisodes = result.value;
                if (newEpisodes == null && item.badge == null) {
                  continue;
                }
                if (newEpisodes == null) {
                  item.badge = null;
                } else if (newEpisodes == 0) {
                  item.badge = '';
                } else if (newEpisodes <= 99) {
                  item.badge = newEpisodes.toString();
                } else {
                  item.badge = '99+';
                }
              }
            }
          }
        }
        items.value = newItems;
        getItemsTriggeredCount -= 1;
      }
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
      if (getItemsTriggeredCount) {
        getItemsTriggeredCount = 0;
        apiLastUpdate = 0;
      }
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
