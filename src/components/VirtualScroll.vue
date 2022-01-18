<template>
  <div
    class="virtualscroll-scroller"
    @scroll="onScroll"
    ref="scrollerEl"
  >
  <div :style="{ height: `${topFillerHeight}px` }" />
    <template v-for="item in visibleItems" :key=item.key>
      <slot :item="item"></slot>
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
  watchEffect,
} from 'vue';
import { isMobile } from '../lib/util.js';

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

    onMounted(() => {
      const instance = getCurrentInstance();
      watchEffect(() => {
        theItems.value = props.items;
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
      isMobile,
      scrollTop,
      scrollerEl,
    };
  },

  methods: {
    onScroll() {
      if (this.updating) {
        return;
      }
      this.updating = true;
      requestAnimationFrame(() => {
        this.updateVisibleItems();
        this.updating = false;
      });
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
      if (this.visibleItems.length > 0 && visibleItems.length > 0
        && this.visibleItems[0].key === visibleItems[0].key
        && this.visibleItems.length === visibleItems.length) {
        // No change.
        return;
      }
      this.topFillerHeight = topFillerHeight > 0 ? topFillerHeight : 0;
      this.bottomFillerHeight = this.totalHeight - curPos;
      this.visibleItems = visibleItems;
    },
  },
});
</script>
