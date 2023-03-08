<template>
  <lrud no-scroll-into-view>
  <div
    class="virtualscroll-scroller"
    @scroll="onScroll"
    @keydown.capture="onKeyDown"
    ref="scrollerEl"
    id="vsc"
  >
  <slot name="header"></slot>
  <div :style="{ height: `${topFillerHeight}px` }" ref="topEl"/>
    <template v-for="item in visibleItems" :key="item.key">
      <slot :item="item" :scrolling="fastScrolling" :onRowFocusIn="onRowFocusIn"></slot>
    </template>
    <div :style="{ height: `${bottomFillerHeight}px` }" />
  </div>
  </lrud>
</template>

<style lang="scss">
.virtualscroll-scroller {
  overflow-x: hidden;
  overflow-y: scroll;
  position: relative;
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
  watch,
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
    const topEl = ref(null);
    const scrollerEl = ref(null);
    const savedScrollTop = ref(0);
    const scrollTop = ref(0);
    const fastScrolling = ref(false);
    const { items } = toRefs(props);

    onMounted(() => {
      const instance = getCurrentInstance();
      const updateItems = () => {
        console.log('VirtualScroll: updateItems');
        theItems.value = items.value;
        let h = 0;
        for (const item of theItems.value) {
          h += item.height;
        }
        totalHeight.value = h;
        instance.ctx.updateVisibleItems();
      };
      watch(items, updateItems);
      updateItems();
    });

    onActivated(() => {
      console.log('activated, set scrollTop to', savedScrollTop.value);
      scrollerEl.value.scrollTop = savedScrollTop.value;
    });

    // An element in one of the rows got the focus. See if we need
    // to scroll to bring it into view.
    function onRowFocusIn(ev, el) {
      let elem = ev.target;
      while (elem.parentElement !== scrollerEl.value) {
        if (!elem.parentElement) {
          console.log('VirtualScroller: onRowFocusIn: lost focus');
          return;
        }
        elem = elem.parentElement;
      }

      // See if we need to scroll the row into view.
      const top = scrollerEl.value.scrollTop;
      const height = scrollerEl.value.clientHeight;
      const bottom = top + height;
      let scrollTo = null;

      if (elem.offsetTop < top) {
        scrollTo = elem.offsetTop - 12;
        if (scrollTo <= topEl.value.offsetTop) {
          scrollTo = 0;
        }
      } else if (elem.offsetTop + elem.offsetHeight >= bottom) {
        scrollTo = elem.offsetTop + elem.offsetHeight - height + 4;
      }

      // Alas, if we scroll to a new position while already
      // smooth-scrolling, the scrolling gets choppy :(
      if (scrollTo !== null) {
        scrollerEl.value.scrollTo({
          left: 0,
          top: scrollTo,
          behavior: 'smooth',
        });
      }
    }

    // Escape brings you back to the top.
    function onKeyDown(ev) {
      if (ev.key === 'Escape' && scrollerEl.value.scrollTop !== 0) {
        scrollerEl.value.scrollTop = 0;
        ev.stopPropagation();
      }
    }

    return {
      theItems,
      visibleItems,
      totalHeight,
      topFillerHeight,
      bottomFillerHeight,
      savedScrollTop,
      topEl,
      scrollerEl,
      lastScrollTm: 0,
      lastScrollPos: 0,
      lastScrollTimer: null,
      fastScrolling,
      scrollPps: 0,
      counter: 0,
      onRowFocusIn,
      onKeyDown,
    };
  },

  methods: {
    onScroll(ev) {
      this.savedScrollTop = this.scrollerEl.scrollTop;
      this.updateScrollPps();
      this.updateVisibleItems(ev);
    },

    updateScrollPps() {
      const pos = this.scrollerEl.scrollTop;
      const now = Date.now();

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
        const pps = 1000 * (dp / dt);
        if (pps > 0) {
          const d = dt > 1000 ? 1 : dt / 1000;
          this.scrollPps = (1 - d) * this.scrollPps + d * pps;
          //console.log('pps: ', this.scrollPps);
        } else {
          this.scrollPps = 0;
        }
      }
      this.lastScrollPos = pos;
      this.lastScrollTm = now;

      // if we're scrolling really fast, set 'fastScrolling'.
      if (this.scrollPps > 4500 && pos > 0) {
        this.lastScrollTimer = setTimeout(() => this.updateScrollPps(), 100);
        this.fastScrolling = true;
      } else {
        this.fastScrolling = false;
      }
    },

    updateVisibleItems() {
      // Remove the header, so that top starts at (- header.clientHeight)
      // This means top === 0 as soon as we scroll past the header.
      const top = this.scrollerEl.scrollTop - this.topEl.offsetTop;
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
          if (visibleItems.length != this.visibleItems.length - 1)
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
