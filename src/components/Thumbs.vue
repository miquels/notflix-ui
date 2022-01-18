<template>
  <div ref="el">
    <q-resize-observer @resize="onResize"/>
    <virtual-scroll
      class="thumbs-virtual-scroller relative"
      :class="prettyScrollbar"
      :items="getItems()"
    >
      <template v-slot="{ item, scrolling }">
        <q-item class="row no-wrap q-pa-none" :key="item.key" :style="{ height: item.height }">
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
import {
  computed,
  defineComponent,
  ref,
  toRefs,
} from 'vue';
import { scroll } from 'quasar';
import { useStore } from 'vuex';
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

export default defineComponent({
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
      imgWidth: 100,
      imgHeight: 150,
      fontSize: 12,
      thumbPadding: 6,
      prettyScrollbar,
      el: ref(null),
    };
  },

  methods: {
    getItems() {
      console.log('getItems, thumbsPerRow is', this.thumbsPerRow);
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
            url: `${theItem.path}/${theItem.poster}`,
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

      if (this.el || width) {
        if (!width) {
          width = scroll.getScrollWidth(this.el);
        }
        if (width < 100) {
          return;
        }
        const thumbWidth = this.imgWidth + 2 * this.thumbPadding;
        this.thumbsPerRow = parseInt((width - 40) / thumbWidth, 10);
        console.log('thumbsPerRow now', this.thumbsPerRow);
      }
    },

    onResize(ev) {
      if (ev.width < 200 || ev.height < 200) {
        return;
      }
      console.log('resize', ev);
      this.calcSizes(ev.width);
    },
  },
});
</script>
