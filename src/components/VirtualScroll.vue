<template>
  <lrud no-scroll-into-view>
  <div
    class="virtualscroll-scroller"
    @scroll="onScroll"
    @keydown.capture="onKeyDown"
    @focusin="onRowFocusIn"
    ref="scrollerEl"
  >
  <slot name="header"></slot>
  <div :style="{ height: `${topFillerHeight}px` }" ref="topEl"/>
    <template v-for="item in visibleItems" :key="item.key">
      <slot :item="item" :scrolling="fastScrolling"></slot>
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

<script setup>
  import {
    onActivated,
    onBeforeUpdate,
    onMounted,
    onUpdated,
    ref,
    toRefs,
    watch,
  } from 'vue';

  const props = defineProps({
    items: Array,
  });

  // Reactive vars.
  const theItems = ref([]);
  const visibleItems = ref([]);
  const totalHeight = ref(0);
  const topFillerHeight = ref(0);
  const bottomFillerHeight = ref(0);
  const topEl = ref(null);
  const scrollerEl = ref(null);
  const scrollTop = ref(0);
  const fastScrolling = ref(false);
  const { items } = toRefs(props);

  // Non-reactive vars.
  let lastScrollTm = 0;
  let lastScrollPos = 0;
  let lastScrollTimer = null;
  let savedScrollTop = 0;
  let scrollPps = 0;

  onMounted(() => {
    const updateItems = () => {
      theItems.value = items.value;
      let h = 0;
      for (const item of theItems.value) {
        h += item.height;
      }
      totalHeight.value = h;
      updateVisibleItems();
    };
    watch(items, updateItems);
    updateItems();
  });

  onActivated(() => {
    scrollerEl.value.scrollTop = savedScrollTop;
    updateVisibleItems();
  });

  // An element in one of the rows got the focus. See if we need
  // to scroll to bring it into view.
  function onRowFocusIn(ev, el) {
    let elem = ev.target;
    while (elem.parentElement !== scrollerEl.value) {
      if (!elem.parentElement) {
        // Ayayay. Find the first element with a tabindex and focus that.
        elem = scrollerEl.value.querySelector(':scope [tabindex="0"]');
        if (!elem) {
          console.log('VirtualScroller: onRowFocusIn: lost focus');
          return;
        }
        console.log('VirtualScroller: onRowFocusIn: lost focus - refocussing');
        break;
      }
      elem = elem.parentElement;
    }

    // See if we need to scroll the row into view.
    const top = scrollerEl.value.scrollTop;
    const height = scrollerEl.value.clientHeight;
    const bottom = top + height;
    const headerHeight = topEl.value.offsetTop;
    let scrollTo = null;

    if (elem.offsetTop < top || (elem.offsetTop == headerHeight && top < headerHeight)) {
      scrollTo = elem.offsetTop - 12;
      if (scrollTo <= headerHeight) {
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
      let firstItem = scrollerEl.value.querySelector(':scope [data-item-id]');
      if (firstItem) {
        setTimeout(() => firstItem.focus(), 0);
      }
    }
  }

  function onScroll(ev) {
    savedScrollTop = scrollerEl.value.scrollTop;
    updateScrollPps();
    updateVisibleItems(ev);
  }

  function updateScrollPps() {
    const pos = scrollerEl.value.scrollTop;
    const now = Date.now();

    // stop timer.
    if (lastScrollTimer) {
      clearTimeout(lastScrollTimer);
      lastScrollTimer = null;
    }

    // calculate pps (pixels per seconds).
    if (lastScrollTm) {
      const dp = Math.abs(pos - lastScrollPos);
      const dt = now - lastScrollTm;
      if (dt < 60) {
        // Too fast, cannot calculate a precise pps, so skip.
        // Load timer, make sure we do not miss the last update.
        lastScrollTimer = setTimeout(() => updateScrollPps(), 100);
        return;
      }
      const pps = 1000 * (dp / dt);
      if (pps > 0) {
        const d = dt > 1000 ? 1 : dt / 1000;
        scrollPps = (1 - d) * scrollPps + d * pps;
        //console.log('pps: ', scrollPps);
      } else {
        scrollPps = 0;
      }
    }
    lastScrollPos = pos;
    lastScrollTm = now;

    // if we're scrolling really fast, set 'fastScrolling'.
    if (scrollPps > 4500 && pos > 0) {
      lastScrollTimer = setTimeout(() => updateScrollPps(), 100);
      fastScrolling.value = true;
    } else {
      fastScrolling.value = false;
    }
  }

  function updateVisibleItems() {
    // Remove the header, so that top starts at (- header.clientHeight)
    // This means top === 0 as soon as we scroll past the header.
    const top = scrollerEl.value.scrollTop - topEl.value.offsetTop;
    const bottom = top + scrollerEl.value.clientHeight;
    const renderThresHold = scrollerEl.value.clientHeight;
    const newVisibleItems = [];

    let curPos = 0;
    let newTopFillerHeight = 0;
    let idx = 0;

    // First, work up to the first item we want to draw.
    // "visibleItems" is not really a correct term, it's more like
    // "items inside or just outside of the viewport".
    while (idx < theItems.value.length) {
      const item = theItems.value[idx];
      if (curPos + item.height + renderThresHold >= top) {
        // console.log('curPos', curPos, 'top', top, 'clientHeight', renderThresHold);
        break;
      }
      curPos += item.height;
      newTopFillerHeight += item.height;
      idx += 1;
    }

    // Now create a new visibleItems array.
    let visibleHeight = 0;
    while (idx < theItems.value.length) {
      const item = theItems.value[idx];
      if (curPos + item.height > bottom + renderThresHold) {
        if (newVisibleItems.length != visibleItems.value.length - 1)
          break;
      }
      newVisibleItems.push(item);
      curPos += item.height;
      visibleHeight += item.height;
      idx += 1;
    }

    // No change?
    if (visibleItems.value.length === newVisibleItems.length) {
      let change = false;
      for (let i = 0; i < newVisibleItems.length; i += 1) {
        if (visibleItems.value[i].key !== newVisibleItems[i].key) {
          change = true;
          break;
        }
      }
      if (!change) return;
    }

    // Adjust topFiller and bottomFiller div heights.
    topFillerHeight.value = newTopFillerHeight;
    bottomFillerHeight.value = totalHeight.value - newTopFillerHeight - visibleHeight;
    visibleItems.value = newVisibleItems;
  }

</script>
