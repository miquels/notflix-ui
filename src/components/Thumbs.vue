<template>
  <div ref="el" class="fit thumbs-container">
    <q-resize-observer @resize="onResize"/>
    <virtual-scroll
      class="thumbs-virtual-scroller"
      :class="prettyScrollbar"
      :items="getItems()"
    >
      <template v-slot="{ item }">
        <q-item class="row no-wrap q-pa-none" :style="{ height: item.height }">
          <div class="col-12">
            <div class="row justify-center no-wrap">
              <div v-if="item.type === 'header'"> ----------------===========---------------- </div>
              <template v-if="item.type === 'thumbs'">
              <div
                v-for="item2 in item.row"
                :key="item2.key"
                class="thumbs-thumb"
                @click="$emit('select', item2.name)"
              >
                <Image :src="item2.url" :name="item2.name" class="thumbs-img" />
                <div class="thumbs-title">{{ item2.name }}</div>
              </div>
              </template>
            </div>
          </div>
        </q-item>
      </template>
    </virtual-scroll>
  </div>
</template>

<style lang="scss">
.thumbs-container {
  --image-width: 100px;
  --image-height: 150px;
  --thumb-padding: 6px;
  --font-size: 12px;
  position: relative;
}
.thumbs-thumb {
  display: inline-block;
  padding: var(--thumb-padding);
  width: calc(var(--thumb-padding) * 2 + var(--image-width));
  /* removes padding between image and name */
  font-size: 0px;
}
.thumbs-virtual-scroller {
  height: calc(100vh - 100px);
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
  computed,
  defineComponent,
  ref,
  toRefs,
} from 'vue';
import { scroll } from 'quasar';
import { useStore } from 'vuex';
import VirtualScroll from 'components/VirtualScroll.vue';
import Image from 'components/Image.vue';
import { isMobile } from '../lib/util.js';

function gMatch(item, genres) {
  if (genres && genres.length > 0 && !item.genre) return false;
  if (!item.genre || !genres || genres.length === 0) return true;
  for (let i = 0; i < genres.length; i += 1) {
    if (!item.genre.includes(genres[i])) return false;
  }
  return true;
}

export default defineComponent({
  name: 'Thumbs',
  components: {
    Image,
    VirtualScroll,
  },

  props: {
    items: {
      type: Array,
      default: () => [],
    },
    filter: {
      type: String,
      default: '',
    },
  },

  setup(props) {
    const { items } = toRefs(props);
    const store = useStore();

    const theItems = computed(() => {
      const filteredItems = [];

      // console.log('initially,', items);

      // First, the search filter.
      const f = store.state.filter.search.toLowerCase();
      const g = store.state.filter.filterGenres;

      for (let i = 0; i < items.value.length; i += 1) {
        const item = items.value[i];
        const nameMatch = !f || item.name.toLowerCase().includes(f);
        // if (i === 0) console.log('item: ', item);
        const genreMatch = gMatch(item, g);
        if (nameMatch && genreMatch) {
          filteredItems.push(items.value[i]);
        }
      }
      // console.log('filter: ', g);
      // console.log('thumbs: ', filteredItems.length);

      // Now sort.
      const s = store.state.filter.sortBy || 'updated';
      switch (s) {
        case 'updated':
          filteredItems.sort((a, b) => (b.lastvideo || 0) - (a.lastvideo || 0));
          break;
        case 'added':
          filteredItems.sort((a, b) => (b.firstvideo || 0) - (a.firstvideo || 0));
          break;
        case 'year':
          filteredItems.sort((a, b) => (b.year || 0) - (a.year || 0));
          break;
        case 'rating':
          filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'title':
          filteredItems.sort((a, b) => (a.name.localeCompare(b.name)));
          break;
        default:
          break;
      }

      return filteredItems;
    });

    const prettyScrollbar = isMobile() ? '' : 'pretty-scrollbar';
    // console.log('prettyScrollbar:', prettyScrollbar);
    const posterSize = isMobile() ? 1 : 2;
    return {
      posterSize,
      prevPosterSize: null,
      thumbsPerRow: ref(null),
      theItems,
      imgWidth: 0,
      imgHeight: 0,
      prettyScrollbar,
      el: ref(null),
    };
  },

  methods: {
    getItems() {
      // console.log('getItems: theItems:', this.theItems);
      if (!this.el || !this.thumbsPerRow) {
        return [];
      }
      const nrItems = this.theItems.length;
      const rows = [];
      rows.push({ type: 'header', key: 'header', height: 20 });
      const { thumbsPerRow } = this;
      for (let base = 0; base < nrItems; base += thumbsPerRow) {
        const row = [];
        for (let r = 0; r < thumbsPerRow && base + r < nrItems; r += 1) {
          const theItem = this.theItems[base + r];
          const item = {
            key: theItem.id,
            url: this.imgUrl(theItem),
            name: theItem.name,
          };
          row.push(item);
        }
        rows.push({
          row,
          type: 'thumbs',
          height: this.imgHeight + 20,
          key: `${nrItems}.${base}.${thumbsPerRow}`,
        });
      }
      // console.log('Thumbs: thumbsPerRow:', thumbsPerRow, 'item_rows:', rows.length);
      // console.log('getItems:', rows);
      return rows;
    },

    item_rows(from, size) {
      if (!this.el || !this.thumbsPerRow) {
        return [];
      }
      const nrItems = this.theItems.length;
      const rows = [];
      const { thumbsPerRow } = this;
      for (let i = from; i < from + size; i += 1) {
        const base = i * thumbsPerRow;
        const row = [];
        for (let r = 0; r < thumbsPerRow && base + r < nrItems; r += 1) {
          const theItem = this.theItems[base + r];
          const item = {
            key: theItem.id,
            url: this.imgUrl(theItem),
            name: theItem.name,
          };
          row.push(item);
        }
        rows.push({ row, key: `${nrItems}.${base}.${thumbsPerRow}` });
      }
      // console.log('Thumbs: thumbsPerRow:', thumbsPerRow, 'item_rows:', rows.length);
      // console.log('iten_rows:', rows);
      return rows;
    },

    item_nrows() {
      if (!this.el || !this.thumbsPerRow) {
        // console.log('Thumb: nrows = ', 0);
        return 0;
      }

      const nrows = 1 + Math.floor(this.theItems.length / this.thumbsPerRow);
      // console.log('Thumb: nrows = ', nrows);
      return nrows;
    },

    calcSizes(width) {
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
        if (!width) {
          width = scroll.getScrollWidth(this.el);
        }
        if (width < 100) {
          return;
        }
        this.el.style.setProperty('--image-width', `${sizing.imgWidth[psz]}px`);
        this.el.style.setProperty('--image-height', `${sizing.imgHeight[psz]}px`);
        this.el.style.setProperty('--thumbPadding', `${sizing.thumbPadding[psz]}px`);
        this.el.style.setProperty('--font-size', `${sizing.fontSize[psz]}px`);
        const thumbWidth = sizing.imgWidth[psz] + 2 * sizing.thumbPadding[psz];
        this.thumbsPerRow = parseInt((width - 40) / thumbWidth, 10);
      }
    },

    onResize(ev) {
      if (ev.width < 200 || ev.height < 200) {
        return;
      }
      console.log('resize', ev);
      this.calcSizes(ev.width);
    },

    imgUrl(item) {
      if (!item.poster) {
        return '';
      }
      const w = this.imgWidth;
      const h = this.imgHeight;
      return (`${item.path}/${item.poster}?w=${w}&h=${h}&q=70`);
    },
  },
});
</script>
