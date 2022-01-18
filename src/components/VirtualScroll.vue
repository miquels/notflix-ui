<template>
  <div class="virtualscroll-container" ref="el">
    <div
      class="virtualscroll-scroller"
      :class="{ 'pretty-scrollbar': !isMobile() }"
      :style="{ height: `${totalHeight}px` }"
      @scroll="updateVisibleItems"
      ref="scrollerEl"
    >
    <div :style="{ height: `${topFillerHeight}px` }" />
      <template v-for="item in visibleItems" :key=item.key>
        <slot :item="item"></slot>
      </template>
      <div :style="{ height: `${bottomFillerHeight}px` }" />
    </div>
  </div>
</template>

<style lang="scss">
.virtualscroll-container {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.virtualscroll-scroller {
  overflow-y: scroll;
  overflow-x: hidden;
  flex-grow: 1;
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
    const el = ref(null);
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
      isMobile,
      scrollTop,
      scrollerEl,
      el,
    };
  },

  methods: {
    updateVisibleItems() {
      const top = this.scrollerEl.scrollTop;
      const bottom = top + this.el.clientHeight;
      const renderThresHold = this.el.clientHeight;
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
      this.topFillerHeight = topFillerHeight > 0 ? topFillerHeight : 0;
      this.bottomFillerHeight = this.totalHeight - curPos;
      this.visibleItems = visibleItems;
    },
  },
});
</script>
