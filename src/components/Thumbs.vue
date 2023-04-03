<template>
  <div ref="el">
    <q-resize-observer @resize="onResize" />
    <virtual-scroll class="thumbs-virtual-scroller relative" :items="rowItems" ref="scroller">
      <template v-slot:header>
        <q-item class="row no-wrap justify-center q-pa-none q-pb-md">
          <div class="col-auto">
            <FilterBar
              :style="{ width: `${rowWidth}px` }"
              :type="type"
              :genres="genres"
              v-model:search="search"
              v-model:sortBy="sortBy"
              v-model:genreFilter="genreFilter"
            />
          </div>
        </q-item>
      </template>

      <template v-slot:default="{ item, scrolling }">
        <q-item class="row no-wrap justify-center q-pa-none" :style="{ height: item.height }">
          <div class="col-auto">
            <PosterRow
              :style="{ width: `${item.width}px`, height: `${item.height}px` }"
              :items="item.row"
              :height="item.height"
              :padding="thumbPadding"
              :imgWidth="imgWidth"
              :imgHeight="imgHeight"
              :fontSize="fontSize"
              :hideImages="scrolling"
              :favoriteIcons="favoriteIcons"
              @selectItem="selectItem($event)"
            />
          </div>
        </q-item>
      </template>
    </virtual-scroll>
  </div>
</template>

<style lang="scss">
.thumbs-virtual-scroller {
  height: calc(100vh - 100px);
}
</style>

<script>
import { scroll } from 'quasar';
import VirtualScroll from 'components/VirtualScroll.vue';
import PosterRow from 'components/PosterRow.vue';
import FilterBar from 'components/FilterBar.vue';
// import { isMobile } from '../lib/util.js';

function gMatch(item, genres) {
  if (genres && genres.length > 0 && !item.genre) return false;
  if (!item.genre || !genres || genres.length === 0) return true;
  for (let i = 0; i < genres.length; i += 1) {
    if (!item.genre.includes(genres[i])) return false;
  }
  return true;
}

export default {
  name: 'Thumbs',

  components: {
    FilterBar,
    PosterRow,
    VirtualScroll,
  },

  inject: ['emitter'],

  props: {
    items: {
      type: Array,
      default: () => [],
    },
    genres: {
      type: Array,
      default: () => [],
    },
    type: String,
    favoriteIcons: Boolean,
  },

  data() {
    const isLarge = (window.screen.width >= 1024 || window.screen.height >= 1024);
    const posterSize = isLarge ? 2 : 1;
    const sortBy = this.type === 'series' ? 'Updated' : 'Added';

    return {
      posterSize,
      thumbsPerRow: 1,
      imgWidth: 133,
      imgHeight: 200,
      selectedItem: null,
      fontSize: 14,
      thumbPadding: 6,
      search: '',
      sortBy,
      genreFilter: [],
      isActive: true,
    };
  },

  mounted() {
    this.emitter.on('scrollToTop', () => {
      if (this.isActive) {
        this.$refs.scroller.$el.scrollTop = 0;
      }
    });
    this.calcSizes();
  },

  activated() {
    const width = scroll.getScrollWidth(this.$el);
    const height = scroll.getScrollHeight(this.$el);
    this.search = '';
    this.isActive = true;
    if (this.selectedItem) {
      // We need to wait one tick for the redraw to have happened.
      setTimeout(() => {
        const id = this.selectedItem.id;
        const elem = this.$refs.el.querySelector(`:scope [data-item-id="${id}"`);
        if (elem) {
          // console.log('Thumbs: re-focussing on', id);
          elem.focus();
        }
        this.selectedItem = null;
      }, 0);
    }
  },

  deactivated() {
    this.isActive = false;
  },

  computed: {
    rowItems() {
      const { items, sortById } = this.filteredItems;
      return this.getRows(items, sortById);
    },

    filteredItems() {
      return this.filterItems(this.items);
    },

    rowWidth() {
      return (this.imgWidth + 2 * this.thumbPadding) * this.thumbsPerRow;
    },
  },

  methods: {
    selectItem(item) {
      this.selectedItem = item;
      this.$emit('select-item', item);
      //console.log('Thumbs: DBG: selectedItem is', item);
    },

    getRows(items, sortById) {
      const { thumbsPerRow } = this;
      const nrItems = items.length;

      const width = (this.imgWidth + 2 * this.thumbPadding) * thumbsPerRow;
      const height = this.imgHeight + 32 + 2 * this.thumbPadding;

      const rows = [];

      for (let base = 0; base < nrItems; base += thumbsPerRow) {
        const row = [];
        for (let r = 0; r < thumbsPerRow && base + r < nrItems; r += 1) {
          const theItem = items[base + r];
          const item = {
            key: theItem.id,
            name: theItem.name,
            id: theItem.id,
            collection: theItem.collection,
          };
          if (theItem.poster) {
            item.url = `${theItem.path}/${theItem.poster}`;
          }
          row.push(item);
        }
        rows.push({
          row,
          type: 'thumbs',
          width,
          height,
          key: `${nrItems}.${base}.${thumbsPerRow}.${sortById}`,
        });
      }
      return rows;
    },

    filterItems(items) {
      const filteredItems = [];
      let sortById;

      // First, the search filter.
      const f = this.search ? this.search.toLowerCase() : '';
      const g = this.genreFilter;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const nameMatch = !f || item.name.toLowerCase().includes(f);
        // if (i === 0) console.log('item: ', item);
        const genreMatch = gMatch(item, g);
        if (nameMatch && genreMatch) {
          filteredItems.push(items[i]);
        }
      }
      // console.log('filter: ', g);
      // console.log('thumbs: ', filteredItems.length);

      // Now sort.
      const s = this.sortBy.toLowerCase();
      switch (s) {
        case 'updated':
          sortById = 1;
          filteredItems.sort((a, b) => (b.lastvideo || 0) - (a.lastvideo || 0));
          break;
        case 'added':
          sortById = 2;
          filteredItems.sort((a, b) => (b.firstvideo || 0) - (a.firstvideo || 0));
          break;
        case 'year':
          sortById = 3;
          filteredItems.sort((a, b) => (b.year || 0) - (a.year || 0));
          break;
        case 'rating':
          sortById = 4;
          filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'title':
          sortById = 5;
          filteredItems.sort((a, b) => (a.name.localeCompare(b.name)));
          break;
        default:
          sortById = Date.now();
          break;
      }

      return { items: filteredItems, sortById };
    },

    calcSizes(width) {
      if (!width) {
        width = scroll.getScrollWidth(this.$el);
      }
      if (width === this.scrollWidth) {
        // console.log('Thumbs: calcSizes: no change in width (', width, ')');
        return;
      }
      this.scrollWidth = width;

      const sizing = {
        imgWidth: [100, 133, 200],
        imgHeight: [150, 200, 270],
        thumbPadding: [5, 6, 8],
        fontSize: [12, 14, 16],
      };
      const psz = this.posterSize - 1;
      this.imgWidth = sizing.imgWidth[psz];
      this.imgHeight = sizing.imgHeight[psz];
      this.fontSize = sizing.fontSize[psz];
      this.thumbPadding = sizing.thumbPadding[psz];

      if (width < 320) {
        width = 320;
      }
      // Iphone 5 is 320 pixels wide, so only shows 2 thumbs.
      // Add some extra padding.
      if (width < 350 && psz === 0) {
        this.thumbPadding = 20;
      }
      const thumbWidth = this.imgWidth + 2 * this.thumbPadding;
      this.thumbsPerRow = parseInt((width - 20) / thumbWidth, 10);
    },

    onResize(ev) {
      if (ev.width === 0 || ev.height === 0) {
        return;
      }
      // console.log('Thumbs: resize', ev);
      this.calcSizes(ev.width);
    },
  },
};
</script>
