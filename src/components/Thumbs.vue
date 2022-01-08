<template>
  <div ref="el" class="fit thumbs-container">
    <q-resize-observer @resize="onResize"/>
    <q-virtual-scroll
      style="max-height: calc(100vh - 100px)"
      :virtual-scroll-item-size="150"
      :virtual-scroll-slice-size="10"
      :items-fn="item_rows"
      :items-size="item_nrows()"
    >
      <template v-slot="{ item }">
        <q-item :key="item.key" class="row no-wrap justify-center q-pa-none">
          <div class="col-auto no-wrap">
            <div
              v-for="item2 in item.row"
              :key="item2.key"
              class="thumbs-thumb"
              @click="$emit('select', item2.key)">
            >
              <img :src="item2.item.url" class="thumbs-img">
              <div class="thumbs-title">{{ item2.item.name }}</div>
            </div>
          </div>
        </q-item>
      </template>
    </q-virtual-scroll>
  </div>
</template>

<style>
.thumbs-container {
  --image-width: 100px;
  --image-height: 150px;
  --thumb-padding: 6px;
  --font-size: 12px;
}
.thumbs-thumb {
  display: inline-block;
  padding: var(--thumb-padding);
  width: calc(var(--thumb-padding) * 2 + var(--image-width));
  /* removes padding between image and name */
  font-size: 0px;
}
.thumbs-thumb:hover {
  transform: scale(1.1);
  transition: all .2s ease-in-out;
  cursor: pointer;
  box-shadow: 0px 0px 10px 1px #888;
  z-index: 4;
}
.thumbs-img {
  height: var(--image-height);
  width: var(--image-width);
  display: block;
  background-color: black;
}
.thumbs-title {
  width: var(--image-width);
  font-size: var(--font-size);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  background-color: black;
}
</style>

<script>
import {
  defineComponent,
  markRaw,
  ref,
} from 'vue';
import { scroll } from 'quasar';
import Config from '../lib/config.js';

export default defineComponent({
  name: 'Thumbs',

  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },

  setup() {
    const config = new Config();
    return {
      apiUrl: config.apiUrl,
      posterSize: ref(1),
      prevPosterSize: null,
      thumbsPerRow: ref(null),
      imgWidth: 0,
      imgHeight: 0,
      el: ref(null),
    };
  },

  methods: {
    item_rows(from, size) {
      if (!this.el || !this.thumbsPerRow) {
        return [];
      }
      const rows = [];
      const { thumbsPerRow } = this;
      for (let i = from; i < from + size; i += 1) {
        const base = i * thumbsPerRow;
        const row = [];
        for (let r = 0; r < thumbsPerRow && base + r < this.items.length; r += 1) {
          const theItem = this.items[base + r];
          let item = {
            url: this.imgUrl(theItem),
            name: theItem.name,
          };
          item = JSON.parse(JSON.stringify(markRaw(item)));
          row.push({ item, key: base + r });
        }
        rows.push({ row, key: `${base}.${thumbsPerRow}` });
      }
      console.log('Thumbs: thumbsPerRow:', thumbsPerRow, 'item_rows:', rows.length);
      return rows;
    },

    item_nrows() {
      if (!this.el || !this.thumbsPerRow) {
        console.log('Thumb: nrows = ', 0);
        return 0;
      }
      const nrows = 1 + Math.floor(this.items.length / this.thumbsPerRow);
      console.log('Thumb: nrows = ', nrows);
      return nrows;
    },

    calcSizes() {
      const sizing = {
        imgWidth: [100, 133, 200],
        imgHeight: [150, 200, 270],
        thumbPadding: [5, 6, 8],
        fontSize: [12, 14, 16],
      };
      const psz = this.posterSize - 1;
      this.imgWidth = sizing.imgWidth[psz];
      this.imgHeight = sizing.imgHeight[psz];
      if (this.el) {
        const width = scroll.getScrollWidth(this.el);
        if (width < 100) {
          return;
        }
        this.el.style.setProperty('--image-width', `${sizing.imgWidth[psz]}px`);
        this.el.style.setProperty('--image-height', `${sizing.imgHeight[psz]}px`);
        this.el.style.setProperty('--thumbPadding', `${sizing.thumbPadding[psz]}px`);
        this.el.style.setProperty('--font-size', `${sizing.fontSize[psz]}px`);
        const thumbWidth = sizing.imgWidth[psz] + 2 * sizing.thumbPadding[psz];
        this.thumbsPerRow = parseInt((width - 20) / thumbWidth, 10);
      }
    },

    onResize(ev) {
      if (ev.Width < 200 || ev.Height < 200) {
        return;
      }
      console.log('resize', ev);
      this.calcSizes();
    },

    imgUrl(item) {
      if (!item.poster) {
        return '';
      }
      const w = this.imgWidth;
      const h = this.imgHeight;
      const url = `${this.apiUrl}${item.baseurl}/${item.path}/${item.poster}`;
      return (`${url}?w=${w}&h=${h}&q=70`);
    },
  },
});
</script>
