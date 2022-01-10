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
import Config from '../lib/config.js';

export default defineComponent({
  name: 'PageTvShows',
  components: {
    Thumbs,
  },

  setup() {
    const store = useStore();
    const items = ref([]);

    onBeforeMount(() => {
      const config = new Config();
      const api = new API({ url: `${config.apiUrl}/` });
      api.getItems('TV%20Shows').then((theItems) => {
        items.value = theItems;
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
