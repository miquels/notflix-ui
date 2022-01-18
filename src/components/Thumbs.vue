<template>
  <div ref="el">
    <q-resize-observer @resize="onResize"/>
    <virtual-scroll
      class="thumbs-virtual-scroller relative"
      :class="prettyScrollbar"
      :items="rowItems"
    >
      <template v-slot="{ item, scrolling }">
        <q-item class="row no-wrap q-pa-none" :style="{ height: item.height }">
          <div class="col-12">
            <div class="row justify-center no-wrap">
              <div v-if="item.type === 'header'"> ----------------===========---------------- </div>
              <PosterRow
                v-if="item.type === 'thumbs'"
                :items="item.row"
                :height="imgHeight + 20"
                :padding="thumbPadding"
                :imgWidth="imgWidth"
                :imgHeight="imgHeight"
                :fontSize="fontSize"
                :hideImages="scrolling"
                @select="$emit('select', $event)"
              />
            </div>
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
    PosterRow,
    VirtualScroll,
  },

  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    const prettyScrollbar = isMobile() ? '' : 'pretty-scrollbar';
    const posterSize = isMobile() ? 1 : 2;

    return {
      posterSize,
      thumbsPerRow: 1,
      imgWidth: 100,
      imgHeight: 150,
      fontSize: 12,
      thumbPadding: 6,
      prettyScrollbar,
    };
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
      const nrItems = items.length;
      const rows = [];
      rows.push({ type: 'header', key: 'header', height: 20 });
      const { thumbsPerRow } = this;
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
          height: this.imgHeight + 20,
          key: `${nrItems}.${base}.${thumbsPerRow}.${sortById}`,
        });
      }
      return rows;
    },

    filterItems(items) {
      const filteredItems = [];
      let sortById;

      // console.log('initially,', items);

      // First, the search filter.
      const f = this.$store.state.filter.search.toLowerCase();
      const g = this.$store.state.filter.filterGenres;

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
      const s = this.$store.state.filter.sortBy || 'updated';
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
      if (width < 100) {
        return;
      }
      const thumbWidth = this.imgWidth + 2 * this.thumbPadding;
      this.thumbsPerRow = parseInt((width - 40) / thumbWidth, 10);
    },

    onResize(ev) {
      if (ev.width < 200 || ev.height < 200) {
        return;
      }
      console.log('resize', ev);
      this.calcSizes(ev.width);
    },
  },
};
</script>
