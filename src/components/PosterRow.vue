<template>
  <div
    :style="{ height: `${height}px` }"
    class="relative"
    rel="el"
    @focusin="$emit('rowfocusin', $event, $el)"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="poster-row-thumb relative"
      :style="{ padding: `${padding}px` }"
      @click="$emit('select-item', item.id)"
      :data-item-id="item.id"
      tabindex="0"
    >
      <Image
        :src="item.url"
        :id="item.id"
        :name="item.name"
        :width="imgWidth"
        :height="imgHeight"
        :hidden="hideImages"
        :favorite="isFavorite(item)"
        @favorite="toggleFavorite($event)"
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
  position: relative;
  display: inline-block;
  outline: 0;
  // removes padding between image and name
  font-size: 0px;
}
.poster-row-thumb:hover, .poster-row-thumb:focus {
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
  ref,
} from 'vue';
import { useApi } from '../lib/api';
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
    collection: {
      type: String,
      default: null,
    },
    height: Number,
    imgWidth: Number,
    imgHeight: Number,
    hideImages: Boolean,
    padding: Number,
    fontSize: Number,
    favoriteIcons: Boolean,
  },

  setup(props) {
    const api = useApi();
    const el = ref(null);
    function toggleFavorite(fav) {
      let isFav = api.isFavorite(fav.id) === true;
      api.setFavorite(fav.id, !isFav);
    }
    function isFavorite(show) {
      if (!props.favoriteIcons) {
        return null;
      }
      return api.isFavorite(show.id) === true;
    }
    return {
      el,
      toggleFavorite,
      isFavorite,
    }
  },
});
</script>
