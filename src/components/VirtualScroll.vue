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
  onMounted,
  onActivated,
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
    };
  },

  methods: {
    onScroll() {
      if (this.updating) {
        return;
      }
      this.updating = true;
      requestAnimationFrame(() => {
        this.updateScrollPps();
        this.updateVisibleItems();
        this.updating = false;
      });
    },

    updateScrollPps() {
      const pos = this.scrollerEl.scrollTop;
      const now = Date.now();
      let pps = 0;
      if (this.lastScrollTm) {
        const dp = Math.abs(pos - this.lastScrollPos);
        const dt = now - this.lastScrollTm;
        if (dt < 60) {
          return;
        }
        pps = dt === 0 ? 100000 : 1000 * (dp / dt);
      }
      this.lastScrollPos = pos;
      this.lastScrollTm = now;
      if (pps > 4500) {
        if (this.lastScrollTimer) {
          clearTimeout(this.lastScrollTimer);
        }
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

      this.scrollTop = top;
      let curPos = 0;
      let topFillerHeight = -1;

      for (const item of this.theItems) {
        if (curPos + item.height + renderThresHold >= top) {
          if (topFillerHeight < 0) {
            topFillerHeight = curPos;
          }
          visibleItems.push(item);
        }
        curPos += item.height;
        if (curPos > bottom + renderThresHold) {
          break;
        }
      }
      /*
      if (this.visibleItems.length > 0 && visibleItems.length > 0
        && this.visibleItems[0].key === visibleItems[0].key
        && this.visibleItems.length === visibleItems.length) {
        // No change.
        console.log('no change');
        // return;
      }
      */
      this.topFillerHeight = topFillerHeight > 0 ? topFillerHeight : 0;
      this.bottomFillerHeight = this.totalHeight - curPos;
      this.visibleItems = visibleItems;
    },
  },
});
</script>
