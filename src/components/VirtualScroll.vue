<template>
  <div
    class="virtualscroll-scroller"
    @scroll="onScroll"
    ref="scrollerEl"
  >
  <div :style="{ height: `${topFillerHeight}px` }" />
    <template v-for="item in visibleItems" :key="item.key">
      <slot :item="item" :scrolling="scrolling"></slot>
    </template>
    <div :style="{ height: `${bottomFillerHeight}px` }" />
  </div>
</template>

<style lang="scss">
.virtualscroll-scroller {
  overflow-x: hidden;
  overflow-y: scroll;
}
</style>

<script>
import {
  defineComponent,
  getCurrentInstance,
  onActivated,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  ref,
  toRefs,
  watchPostEffect,
} from 'vue';

export default defineComponent({
  props: {
    items: Array,
  },

  setup(props) {
    const theItems = ref([]);
    const visibleItems = ref([]);
    const totalHeight = ref(0);
    const topFillerHeight = ref(0);
    const bottomFillerHeight = ref(0);
    const scrollerEl = ref(null);
    const scrollTop = ref(0);
    const scrolling = ref(false);
    const { items } = toRefs(props);

    onMounted(() => {
      const instance = getCurrentInstance();
      watchPostEffect(() => {
        theItems.value = items.value;
        let h = 0;
        for (const item of theItems.value) {
          h += item.height;
        }
        totalHeight.value = h;
        instance.ctx.updateVisibleItems();
      });
    });

    onActivated(() => {
      scrollerEl.value.scrollTop = scrollTop.value;
    });

    // Restore scroll position after DOM update.
    onBeforeUpdate(() => {
      if (scrollerEl.value) {
        scrollTop.value = scrollerEl.value.scrollTop;
      }
    });
    onUpdated(() => {
      if (scrollerEl.value) {
        scrollerEl.value.scrollTop = scrollTop.value;
      }
    });

    return {
      theItems,
      visibleItems,
      totalHeight,
      topFillerHeight,
      bottomFillerHeight,
      updating: false,
      scrollTop,
      scrollerEl,
      lastScrollTm: 0,
      lastScrollPos: 0,
      lastScrollTimer: null,
      scrolling,
      counter: 0,
    };
  },

  methods: {
    onScroll(ev) {
      this.updateScrollPps();
      this.updateVisibleItems(ev);
    },

    updateScrollPps() {
      const pos = this.scrollerEl.scrollTop;
      const now = Date.now();
      let pps = 0;

      // stop timer.
      if (this.lastScrollTimer) {
        clearTimeout(this.lastScrollTimer);
        this.lastScrollTimer = null;
      }

      // calculate pps (pixels per seconds).
      if (this.lastScrollTm) {
        const dp = Math.abs(pos - this.lastScrollPos);
        const dt = now - this.lastScrollTm;
        if (dt < 60) {
          // Too fast, cannot calculate a precise pps, so skip.
          // Load timer, make sure we do not miss the last update.
          this.lastScrollTimer = setTimeout(() => this.updateScrollPps(), 100);
          return;
        }
        pps = 1000 * (dp / dt);
      }
      this.lastScrollPos = pos;
      this.lastScrollTm = now;

      // if we're scrolling really fast, set 'scrolling'.
      if (pps > 4500 && pos > 0) {
        this.lastScrollTimer = setTimeout(() => this.updateScrollPps(), 100);
        this.scrolling = true;
      } else {
        this.scrolling = false;
      }
    },

    updateVisibleItems() {
      const top = this.scrollerEl.scrollTop;
      const bottom = top + this.scrollerEl.clientHeight;
      const renderThresHold = this.scrollerEl.clientHeight;
      const visibleItems = [];

      let curPos = 0;
      let topFillerHeight = 0;
      let idx = 0;

      // First, work up to the first item we want to draw.
      // "visibleItems" is not really a correct term, it's more like
      // "items inside or just outside of the viewport".
      while (idx < this.theItems.length) {
        const item = this.theItems[idx];
        if (curPos + item.height + renderThresHold >= top) {
          // console.log('curPos', curPos, 'top', top, 'clientHeight', renderThresHold);
          break;
        }
        curPos += item.height;
        topFillerHeight += item.height;
        idx += 1;
      }

      // Now create a new visibleItems array.
      let visibleHeight = 0;
      while (idx < this.theItems.length) {
        const item = this.theItems[idx];
        if (curPos + item.height > bottom + renderThresHold) {
          break;
        }
        visibleItems.push(item);
        curPos += item.height;
        visibleHeight += item.height;
        idx += 1;
      }

      // No change?
      if (this.visibleItems.length === visibleItems.length) {
        let change = false;
        for (let i = 0; i < visibleItems.length; i += 1) {
          if (this.visibleItems[i].key !== visibleItems[i].key) {
            change = true;
            break;
          }
        }
        if (!change) return;
      }

      // Adjust topFiller and bottomFiller div heights.
      this.topFillerHeight = topFillerHeight;
      this.bottomFillerHeight = this.totalHeight - topFillerHeight - visibleHeight;
      this.visibleItems = visibleItems;
    },
  },
});
</script>
