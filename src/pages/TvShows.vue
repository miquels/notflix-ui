<template>
  <q-page class="flex flex-center">
    <Thumbs
     :items="items"
     :filter="store.state.search"
     class="fit"
     @select="show_clicked"
   />
  </q-page>
</template>

<script>
import {
  defineComponent,
  onBeforeMount,
  onUnmounted,
  onActivated,
  onDeactivated,
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

    onBeforeMount(() => {
      const api = new API();
      api.getItems('TV%20Shows').then((theItems) => {
        // sort by lastUpdated.
        const sortItems = [...theItems];
        sortItems.sort((a, b) => b.lastvideo - a.lastvideo);
        // console.log(sortItems);
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
      api: null,
      store,
      items,
    };
  },

  methods: {
    show_clicked(showName) {
      console.log('clicked on', showName);
      this.$router.push(`/tv-shows/TV Shows/${showName}`);
    },
  },
});
</script>
