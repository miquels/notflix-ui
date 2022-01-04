<template>
  <q-page class="flex flex-center">
    <Thumbs :items="items" class="fit"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  ref,
} from 'vue';
import Thumbs from 'components/Thumbs.vue';
import API from '../lib/api.js';
import Config from '../lib/config.js';

export default defineComponent({
  name: 'PageTvShows',
  components: {
    Thumbs,
  },

  setup() {
    onMounted(() => {
      const instance = getCurrentInstance();
      instance.ctx.on_mounted();
    });
    return {
      api: null,
      items: ref([]),
    };
  },

  methods: {
    on_mounted() {
      const config = new Config();
      this.api = new API({ url: `${config.apiUrl}/` });
      this.api.getItems('TV%20Shows').then((items) => {
        this.items = items;
      });
    },
  },
});
</script>
