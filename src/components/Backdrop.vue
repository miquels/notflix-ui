<template>
  <div class="backdrop-div" :style="style"/>
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

export default defineComponent({
  name: 'Backdrop',

  props: {
    poster: String,
    fanart: String,
  },

  setup(props) {
    const { poster, fanart } = toRefs(props);

    const style = ref(null);
    const ratio = window.devicePixelRatio * window.outerWidth / window.innerWidth;
    const height = Math.trunc(250 * ratio);

    function updateImage(portrait) {
      let aPoster = poster.value ? poster.value : fanart.value;
      let aFanart = fanart.value ? fanart.value : poster.value;
      if (!aPoster && !aFanart) {
        aPoster = '/img/film-background.jpg';
        aFanart = '/img/film-background.jpg';
      }

      // Chrome has a bug where a linear gradient over a background image
      // sometimes leaves an artifact of about 1 pixel. This seems to happen
      // when the size is not (near) an integer number of pixels. The below
      // calc(30% + 0.4px) is somewhat of a workaround, at least for 1280x720 (TV).
      //
      // See:
      // https://stackoverflow.com/questions/64436505/linear-gradient-not-covering-whole-image-leaves-1px-border

      let image, gradient, left;
      if (portrait) {
        image = `${aPoster}?q=90&h=${height}`;
        gradient = 'rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) 100%';
        left = '0';
      } else {
        image = `${aFanart}?q=90&h=${height}`;
        gradient = 'rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%';
        left = 'calc(30% + 0.4px)';
      }
      style.value = {
        backgroundImage: `linear-gradient(to right, ${gradient}), url(${image})`,
        left: left,
      };
    }

    function onOrientation(ev) {
      updateImage(ev.matches);
    }
    const matchMedia = window.matchMedia("(orientation: portrait)");
    watchEffect(() => {
      updateImage(matchMedia.matches);
    });

    onBeforeMount(() => {
      matchMedia.addEventListener("change", onOrientation);
    });

    onUnmounted(() => {
      matchMedia.removeEventListener("change", onOrientation);
    });

    return {
      style,
    };
  }
})
</script>
