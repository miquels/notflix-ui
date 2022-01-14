<template>
  <q-page class="flex flex-center">
    <Thumbs
      :items="items"
      :filter="store.state.search"
      class="fit"
      @select="movie_clicked"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
  onBeforeMount,
  onActivated,
  onUnmounted,
  onDeactivated,
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

    onBeforeMount(() => {
      const api = new API();
      api.getItems('Movies').then((theItems) => {
        // Sort by last added.
        const sortItems = [...theItems];
        sortItems.sort((a, b) => b.lastvideo - a.lastvideo);
        items.value = sortItems;
      });
      store.commit('showSearch', true);
    });

    onActivated(() => {
      store.commit('showSearch', true);
    });
    onUnmounted(() => {
      store.commit('search', '');
      store.commit('showSearch', false);
    });
    onDeactivated(() => {
      store.commit('search', '');
      store.commit('showSearch', false);
    });

    return {
      items,
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
