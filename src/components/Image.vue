<template>
  <div class="image-container" :style="style">
    <div class="image-background"><span class="image-name">{{ name }}</span></div>
    <img v-if="imgSrc && !hidden" :src="imgSrc" :style="imgStyle" :onerror="onError">
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  watchEffect,
} from 'vue';

const WIDTHS = [100, 133, 200, 500];
const HEIGHTS = [150, 200, 270, 500];

function clamp(w, ranges) {
  for (const r of ranges) {
    if (w <= r) return r;
  }
  return w;
}

export default defineComponent({
  name: 'Image',
  props: {
    src: String,
    errorSrc: String,
    hidden: Boolean,
    name: String,
    width: Number,
    height: Number,
  },

  setup(props) {
    const imgStyle = ref({});
    const style = ref({});
    const onError = ref('');
    const imgSrc = ref('');

    watchEffect(() => {
      style.value = {};
      imgStyle.value = {};
      if (props.width) {
        imgStyle.value.width = `${props.width}px`;
        style.value.width = `${props.width}px`;
      }
      if (props.height) {
        imgStyle.value.height = `${props.height}px`;
        style.value.height = `${props.height}px`;
      }
      if (!style.value.height) {
        imgStyle.value['max-height'] = '100%';
      }
      if (!style.value.width) {
        imgStyle.value['max-width'] = '100%';
      }

      imgSrc.value = props.src ? `${props.src}?q=70` : '';
      if (props.errorSrc) {
        if (!imgSrc.value) imgSrc.value = props.errorSrc;
        onError.value = `this.src='${props.errorSrc}'`;
      }

      const ratio = window.devicePixelRatio || 1;
      if (props.width) {
        const w = ratio * clamp(props.width, WIDTHS);
        imgSrc.value += `&w=${w}`;
      }
      if (props.height) {
        const h = ratio * clamp(props.height, HEIGHTS);
        imgSrc.value += `&w=${h}`;
      }
    });

    return {
      imgSrc,
      onError,
      style,
      imgStyle,
    };
  },
});
</script>

<style lang="scss">
.image-container {
  position: relative;
}
.image-background {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  display: flex;
  align-items: center;
  background: black;
  background: linear-gradient(to bottom, rgba(125,126,125,1) 0%,rgba(14,14,14,1) 100%);
  color: #ddd;
  text-align: center;
  font-size: 14px;
  font-family: sans-serif;
  font-weight: bold;
  transition: all .2s ease-in-out;
  text-overflow: ellipsis;
  overflow: hidden;
  z-index: -1;
}
.image-img {
  width: 100%;
  height: 100%;
  transition: all .2s ease-in-out;
  overflow: hidden;
}
.image-name {
  width: 100%;
}
</style>
