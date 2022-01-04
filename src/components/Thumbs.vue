<template>
  <q-virtual-scroll class="fit" :items="item_rows()">
    <template v-slot="{ item, index }">
      <q-item :key="index" class="row thumbs-row">
        <div v-for="item2 in item" :key="item2.name" class="col">
          <img :src="img_url(item2)" class="col thumbs-thumb">
        </div>
      </q-item>
    </template>
  </q-virtual-scroll>
</template>

<style>
.thumbs-row {
  height: 128px;
  width: 100%;
}
.thumbs-thumb {
  height: 120px;
}
</style>

<script>
import {
  defineComponent,
} from 'vue';
import Config from '../lib/config.js';

export default defineComponent({
  name: 'Thumbs',

  props: {
    items: Array,
  },

  setup() {
    const config = new Config();
    console.log('apiUrl', config.apiUrl);
    return {
      apiUrl: config.apiUrl,
    };
  },

  methods: {
    item_rows() {
      const rows = [];
      for (let i = 0; i < this.items.length; i += 8) {
        const row = [];
        for (let r = 0; r < 8 && r + i < this.items.length; r += 1) {
          row.push(this.items[r + i]);
        }
        rows.push(row);
      }
      console.log('item_rows', rows);
      return rows;
    },

    img_url(item) {
      const w = 90;
      const h = 120;
      const url = `${this.apiUrl}${item.baseurl}/${item.path}/${item.poster}`;
      return (`${url}?w=${w}&h=${h}&q=70`);
    },
  },
});
</script>
