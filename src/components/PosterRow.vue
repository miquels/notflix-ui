<template>
  <div :style="{ height: `${height}px` }" class="relative">
    <div
      v-for="item in items"
      :key="item.key"
      class="poster-row-thumb relative"
      :style="{ padding: `${padding}px` }"
      @click="$emit('select', item.name)"
    >
      <Image
        :src="item.url"
        :name="item.name"
        :width="imgWidth"
        :height="imgHeight"
        :hidden="hideImages"
      />
      <div
        class="poster-row-thumb-title"
        :style="{ fontSize: `${fontSize}px`, width: `${imgWidth}px` }"
      >
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.poster-row-thumb {
  display: inline-block;
  // removes padding between image and name
  font-size: 0px;
}
.poster-row-thumb:hover {
  transform: scale(1.1);
  transition: all .2s ease-in-out;
  cursor: pointer;
  box-shadow: 0px 0px 10px 1px #888;
  z-index: 100;
}
.poster-row-thumb-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  background-color: black;
}
</style>

<script>
import {
  defineComponent,
} from 'vue';
import Image from 'components/Image.vue';

export default defineComponent({
  name: 'PosterRow',
  components: {
    Image,
  },

  props: {
    items: {
      type: Array,
      default: () => [],
    },
    height: Number,
    imgWidth: Number,
    imgHeight: Number,
    hideImages: Boolean,
    padding: Number,
    fontSize: Number,
  },
});
</script>
