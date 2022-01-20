<template>
  <div ref="el">
    <q-resize-observer @resize="onResize"/>
    <virtual-scroll
      class="thumbs-virtual-scroller relative"
      :class="prettyScrollbar"
      :items="rowItems"
    >
      <template v-slot="{ item, scrolling }">
        <q-item class="row no-wrap justify-center q-pa-none" :style="{ height: item.height }">
          <div class="col-auto">
              <FilterBar
                v-if="item.type === 'filterbar'"
                :style="{ width: `${item.width}px`, height: `${item.height}px` }"
                :type="type"
                :genres="genres"
                v-model:search="search"
                v-model:sortBy="sortBy"
                v-model:genreFilter="genreFilter"
              />
              <PosterRow
                v-if="item.type === 'thumbs'"
                :style="{ width: `${item.width}px`, height: `${item.height}px` }"
                :items="item.row"
                :height="item.height"
                :padding="thumbPadding"
                :imgWidth="imgWidth"
                :imgHeight="imgHeight"
                :fontSize="fontSize"
                :hideImages="scrolling"
                @select="$emit('select', $event)"
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
import VirtualScroll from 'components/VirtualScroll.vue';
import PosterRow from 'components/PosterRow.vue';
import FilterBar from 'components/FilterBar.vue';
import { isMobile } from '../lib/util.js';

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
  },

  data() {
    const prettyScrollbar = isMobile() ? '' : 'pretty-scrollbar';
    const posterSize = isMobile() ? 1 : 2;
    const sortBy = this.type === 'series' ? 'Updated' : 'Added';

    return {
      posterSize,
      thumbsPerRow: 1,
      imgWidth: 133,
      imgHeight: 200,
      fontSize: 14,
      thumbPadding: 6,
      prettyScrollbar,
      search: '',
      sortBy,
      genreFilter: [],
    };
  },

  activated() {
    // console.log('activated');
    this.search = '';
  },

  computed: {
    rowItems() {
      const { items, sortById } = this.filteredItems;
      return this.getRows(items, sortById);
    },

    filteredItems() {
      return this.filterItems(this.items);
    },
  },

  methods: {
    getRows(items, sortById) {
      const { thumbsPerRow } = this;
      const nrItems = items.length;

      const width = (this.imgWidth + 2 * this.thumbPadding) * thumbsPerRow;
      const height = this.imgHeight + 32 + 2 * this.thumbPadding;

      const rows = [];
      rows.push({
        type: 'filterbar',
        key: 'filterbar',
        width,
        height: 32,
      });

      for (let base = 0; base < nrItems; base += thumbsPerRow) {
        const row = [];
        for (let r = 0; r < thumbsPerRow && base + r < nrItems; r += 1) {
          const theItem = items[base + r];
          const item = {
            key: theItem.id,
            url: `${theItem.path}/${theItem.poster}`,
            name: theItem.name,
          };
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

      if (!width) {
        width = this.$q.scroll.getScrollWidth(this.$el);
      }
      if (width < 300) {
        width = 300;
      }
      const thumbWidth = this.imgWidth + 2 * this.thumbPadding;
      this.thumbsPerRow = parseInt((width - 40) / thumbWidth, 10);
    },

    onResize(ev) {
      if (ev.width === 0 || ev.height === 0) {
        return;
      }
      console.log(' resize', ev);
      this.calcSizes(ev.width);
    },
  },
};
</script>
