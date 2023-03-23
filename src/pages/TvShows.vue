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
  inject,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import Thumbs from 'components/Thumbs.vue';
import { useApi } from '../lib/api.js';
import { whenTrue } from '../lib/util.js';

export default defineComponent({
  name: 'PageTvShows',
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
    const collection = '2';

    const isReady = ref(false);
    emitter.emit('progress', true);

    function getItems() {
      api.getItems(collection).then((theItems) => {
        // console.log('setting items', theItems);
        items.value = [ ...theItems ];
        isReady.value = true;
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

    onMounted(() => {
      console.log('TvShows: mounted');
      whenTrue(isReady, () => {
        console.log('TvShows: schedule stop progress bar');
        nextTick(emitter.emit('progress', false));
      });
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
