<template>
  <q-page class="flex flex-center">
    <Thumbs :items="items" class="fit" @select="show_clicked"/>
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
        // FIXME
        window.items = items;
      });
    },

    show_clicked(item) {
      const itemName = this.items[item].name;
      console.log('clicked on', item, itemName);
      this.$router.push(`/tv-shows/TV Shows/${itemName}`);
    },
  },
});
</script>
