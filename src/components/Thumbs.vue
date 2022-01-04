<template>
  <div ref="el" class="fit">
    <q-resize-observer @resize="onResize" />
    <q-virtual-scroll :items="item_rows()">
      <template v-slot="{ item, index }">
        <q-item :key="index" class="row thumbs-row">
          <div v-for="item2 in item" :key="item2.name" class="col">
            <div class="col thumbs-thumb">
              <img :src="img_url(item2)" class="thumbs-img">
            </div>
          </div>
        </q-item>
      </template>
    </q-virtual-scroll>
  </div>
</template>

<style>
.thumbs-row {
  height: 140px;
  width: 100%;
}
.thumbs-thumb {
  display: block;
}
.thumbs-img {
  height: 120px;
  width: 90px;
}
</style>

<script>
import {
  defineComponent,
  ref,
} from 'vue';
import { scroll } from 'quasar';
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
      thumbWidth: 90,
      thumbHeight: 120,
      el: ref(null),
    };
  },

  methods: {
    item_rows() {
      if (!this.el) {
        return [];
      }
      const width = scroll.getScrollWidth(this.el);
      const thumbsPerRow = parseInt(width / this.thumbWidth, 10) - 1;

      const rows = [];
      for (let i = 0; i < this.items.length; i += thumbsPerRow) {
        const row = [];
        for (let r = 0; r < thumbsPerRow && r + i < this.items.length; r += 1) {
          row.push(this.items[r + i]);
        }
        rows.push(row);
      }
      return rows;
    },

    onResize() {
      console.log('resize');
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
