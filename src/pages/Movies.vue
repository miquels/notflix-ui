<template>
  <q-page class="flex flex-center">
    <Thumbs :items="items" class="fit" @select="movie_clicked"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
  getCurrentInstance,
  onBeforeMount,
  ref,
} from 'vue';
import Thumbs from 'components/Thumbs.vue';
import API from '../lib/api.js';
import Config from '../lib/config.js';

export default defineComponent({
  name: 'PageMovies',
  components: {
    Thumbs,
  },

  setup() {
    onBeforeMount(() => {
      const instance = getCurrentInstance();
      instance.ctx.onBeforeMount();
    });
    return {
      api: null,
      items: ref([]),
    };
  },

  methods: {
    onBeforeMount() {
      const config = new Config();
      this.api = new API({ url: `${config.apiUrl}/` });
      this.api.getItems('Movies').then((items) => {
        this.items = items;
      });
    },

    movie_clicked(item) {
      const itemName = this.items[item].name;
      this.$router.push(`/movies/Movies/${itemName}`);
    },
  },
});
</script>
