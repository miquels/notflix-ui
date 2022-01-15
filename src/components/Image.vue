<template>
  <img v-if="imgSrc" :src="imgSrc" :style="style" :onerror="onError">
  <div v-else class="image-name" :style="style">{{ name }}</div>
</template>

<style>
.image-name {
  font-size: 16px;
  color: white;
  overflow-wrap: break-word;
  hyphens: manual;
  background: #333333;
}
</style>

<script>
import {
  defineComponent,
  markRaw,
} from 'vue';

const WIDTHS = [100, 133, 200, 500];
const HEIGHTS = [150, 200, 270, 500];

function clamp(w, ranges) {
  // eslint-disable-next-line
  for (let i in ranges) {
    if (w <= ranges[i]) return ranges[i];
  }
  return w;
}

export default defineComponent({
  name: 'Image',
  props: {
    src: String,
    errorSrc: String,
    name: String,
    width: Number,
    height: Number,
  },

  setup(props) {
    let imgSrc = props.src ? `${props.src}?q=70` : '';
    const props_ = markRaw(props);
    const { width, height, error } = props_;

    const style = {};
    if (width) {
      style.width = width;
    }
    if (height) {
      style.height = height;
    }
    if (!style.height) {
      style['max-height'] = '100%';
    }
    if (!style.width) {
      style['max-width'] = '100%';
    }

    let onError = '';
    if (error) {
      if (!imgSrc) imgSrc = error;
      onError = `this.src='${error}'`;
    }

    if (width) {
      const w = clamp(width, WIDTHS);
      imgSrc += `&w=${w}`;
    }
    if (height) {
      const h = clamp(height, HEIGHTS);
      imgSrc += `&w=${h}`;
    }

    return {
      imgSrc,
      onError,
      style,
    };
  },
});
</script>
