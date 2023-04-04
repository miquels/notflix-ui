<template>
  <div class="image-container relative" :style="style">
    <div v-if="name" class="image-background"><span class="image-name">{{ name }}</span></div>
    <q-badge v-if="badge != null" rounded floating color="primary" :label="badge" />
    <img
      v-if="imgSrc && !hidden"
      :src="imgSrc"
      :style="imgStyle"
      :onerror="onError"
      decoding="async"
    >
    <q-icon
      v-if="favorite === true || (favorite === false && !isTv)"
      :name="favorite ? 'favorite' : 'favorite_border'"
      size="16px"
      class="image-favorite q-pa-sm"
      :color="favorite ? 'blue' : 'white'"
      @click.stop="toggleFavorite()"
    />
    <q-linear-progress
      v-if="progress != null"
      :value="progress"
      rounded
      instant-feedback
      color="red-14"
      class="q-mt-sm image-progress"
    />
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  watchEffect,
} from 'vue';
import { useQuasar } from 'quasar';

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
    id: String,
    name: String,
    width: Number,
    height: Number,
    progress: Number,
    badge: String,
    favorite: {
      type: Boolean,
      default: null,
    },
  },

  setup(props, context) {
    const quasar = useQuasar();
    const imgStyle = ref({});
    const style = ref({});
    const onError = ref("this.style.display='none'");
    const imgSrc = ref('');
    const isTv = quasar.platform.is.tv;

    watchEffect(() => {
      style.value = {};
      imgStyle.value = { 'object-fit': 'cover' };
      if (props.width) {
        // console.log('props has width', props.width);
        imgStyle.value.width = `${props.width}px`;
        style.value.width = `${props.width}px`;
      }
      if (props.height) {
        imgStyle.value.height = `${props.height}px`;
        style.value.height = `${props.height}px`;
      }
      if (!style.value.height) {
        style.value.height = '100%';
        imgStyle.value['max-height'] = '100%';
      }
      if (!style.value.width) {
        style.value.width = '100%';
        imgStyle.value['max-width'] = '100%';
      }

      imgSrc.value = props.src ? `${props.src}?q=70` : '';
      if (props.errorSrc) {
        if (!imgSrc.value) imgSrc.value = props.errorSrc;
        onError.value = `this.src='${props.errorSrc}'`;
      }

      if (props.src) {
        const ratio = window.devicePixelRatio * window.outerWidth / window.innerWidth;
        const round = m => Math.round(m * 100) / 100;
        if (props.width) {
          const w = round(ratio * clamp(props.width, WIDTHS));
          imgSrc.value += `&w=${w}`;
        }
        if (props.height) {
          const h = round(ratio * clamp(props.height, HEIGHTS));
          imgSrc.value += `&h=${h}`;
        }
      }
    });

    function toggleFavorite() {
      if (!isTv) {
        context.emit('favorite', { id: props.id, name: props.name });
      }
    }

    return {
      imgSrc,
      imgStyle,
      isTv,
      onError,
      style,
      toggleFavorite,
    };
  },
});
</script>

<style lang="scss">
@import '~src/css/mixins.scss';
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
.image-favorite {
  position: absolute;
  right: 0px;
  bottom: 0px;
  z-index: 1;
  @include stroke();
}
.image-favorite:hover {
  cursor: crosshair;
}
.image-name {
  width: 100%;
}
.image-progress {
  width: 100%;
  position: absolute;
  left: 0px;
  bottom: 0px;
  background: $grey-6 !important;
}
</style>
