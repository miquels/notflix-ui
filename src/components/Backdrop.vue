<template>
  <div class="backdrop-div" :style="style">
    <img :src="testImage" style="display:none" @error="error = true" async>
  </div>
</template>

<style>
.backdrop-div {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
  background-color: #000000;
  background-size: cover;
}
</style>

<script>

import {
  defineComponent,
  onBeforeMount,
  onUnmounted,
  ref,
  toRefs,
  watchEffect,
} from 'vue';
import { useQuasar } from 'quasar';
import breakpoint from '../lib/breakpoint.js';

export default defineComponent({
  name: 'Backdrop',

  props: {
    poster: String,
    fanart: String,
  },

  setup(props) {
    const { poster, fanart } = toRefs(props);

    const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const ratio = window.devicePixelRatio * window.outerWidth / window.innerWidth;
    const height = Math.trunc(250 * ratio);
    const style = ref(null);
    const error = ref(null);
    const testImage = ref(pixel);
    const quasar = useQuasar();

    function updateImage() {

      if (!poster.value && !fanart.value) {
        // Not set (yet)
        style.value = {};
        error.value = false;
        return;
      }

      // Image set to '#' means 'no image available, find alternative'
      const dfl_image = '/img/film-background.jpg';
      const check = v => (v.value && v.value !== '#') ? v.value : null;
      let aPoster = check(poster) || check (fanart) || dfl_image;
      let aFanart = check(fanart) || check (poster) || dfl_image;

      const bp = breakpoint();
      let srcImage = bp !== 'xs' && bp !== 'sm' ? aFanart : aPoster;

      // If we got an error loading the image, replace.
      if (error.value) {
        srcImage = dfl_image;
        testImage.value = pixel;
      } else {
        testImage.value = srcImage;
      }

      // Chrome has a bug where a linear gradient over a background image
      // sometimes leaves an artifact of about 1 pixel. This seems to happen
      // when the size is not (near) an integer number of pixels.
      //
      // See:
      // https://stackoverflow.com/questions/64436505/linear-gradient-not-covering-whole-image-leaves-1px-border
      //
      // The correct workaround for that would be to use the css 'round()'
      // function, but that is still experimental. There is a way though..
      //
      // https://stackoverflow.com/questions/37754542/css-calc-round-down-with-two-decimal-cases
      let image, gradient, left;
      if (bp !== 'xs') {
        image = `${srcImage}?q=90&h=${height}`;
        gradient = 'rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%';
        const shf = quasar.platform.is.chrome ? '4.9406564584124654e-324' : '1';
        left = `calc(30% * ${shf} / ${shf})`;
      } else {
        image = `${srcImage}?q=90&h=${height}`;
        gradient = 'rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) 100%';
        left = '0';
      }
      style.value = {
        backgroundImage: `linear-gradient(to right, ${gradient}), url(${image})`,
        left: left,
      };
    }
    watchEffect(() => updateImage());

    let bp = breakpoint();
    function onResize() {
      setTimeout(() => {
        const newbp = breakpoint();
        if (newbp != bp) {
          updateImage();
          bp = newbp;
        }
      }, 0);
    }

    onBeforeMount(() => {
      window.addEventListener('resize', onResize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onResize);
    });

    return {
      error,
      style,
      testImage,
    };
  }
})
</script>
