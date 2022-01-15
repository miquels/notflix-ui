<template>
  <div ref="el" class="fit thumbs-container">
    <q-resize-observer @resize="onResize"/>
    <q-virtual-scroll
      class="thumbs-virtual-scroller"
      :class="prettyScrollbar"
      :virtual-scroll-item-size="150"
      :virtual-scroll-slice-size="3"
      :items-fn="item_rows"
      :items-size="item_nrows()"
    >
      <template v-slot="{ item }">
        <q-item :key="item.key" class="row no-wrap q-pa-none">
          <div class="col-12">
            <div class="row justify-center no-wrap">
              <div
                v-for="item2 in item.row"
                :key="item2.id"
                class="thumbs-thumb"
                @click="$emit('select', item2.name)">
              >
                <Image :src="item2.url" :name="item2.name" class="thumbs-img" />
                <div class="thumbs-title">{{ item2.name }}</div>
              </div>
            </div>
          </div>
        </q-item>
      </template>
    </q-virtual-scroll>
  </div>
</template>

<style lang="scss">
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
.thumbs-virtual-scroller {
  max-height: calc(100vh - 100px);
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
import Image from 'components/Image.vue';
import { isMobile } from '../lib/util.js';

export default defineComponent({
  name: 'Thumbs',
  components: {
    Image,
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
    const rProps = toRefs(props);

    // eslint-disable-next-line
    const items = rProps.items;
    // eslint-disable-next-line
    const filter = rProps.filter;
    const theItems = computed(() => {
      // console.log('computed: items:', items);
      // console.log('computed: filter:', filter);
      if (filter.value === '') {
        return items.value;
      }
      const filteredItems = [];
      const f = filter.value.toLowerCase();
      for (let i = 0; i < items.value.length; i += 1) {
        const item = items.value[i];
        const nameMatch = item.name.toLowerCase().includes(f);
        // FIXME: this doesn't work, because we do not have this info at
        // this point yet - the movie/tv-show details haven't been loaded yet.
        // perhaps a server-side search ?
        let actorMatch = false;
        if (item.nfo && item.nfo.actor) {
          console.log('filter: checking actors', item.nfo.actor);
          for (let a = 0; a < item.nfo.actor.length; a += 1) {
            if (item.nfo.actor[a].toLowerCase().includes(f)) {
              actorMatch = true;
            }
          }
        }
        if (nameMatch || actorMatch) {
          filteredItems.push(items.value[i]);
        }
      }
      return filteredItems;
    });

    const prettyScrollbar = isMobile() ? '' : 'pretty-scrollbar';
    console.log('prettyScrollbar:', prettyScrollbar);
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
      if (ev.Width < 200 || ev.Height < 200) {
        return;
      }
      console.log('resize', ev);
      this.calcSizes(ev.Width);
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
