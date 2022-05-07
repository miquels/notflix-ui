// IosVideo.vue
//
// Used for iPhone (or iPad) where it's really hard to
// build a video player with custom controls.
//
<template>
  <video
    controls
    draggable="false"
    class="ios-video-video"
    disablepictureinpicture
    crossorigin
    x-webkit-airplay="allow"
    autoplay
    preload="metadata"
    ref="video"
  />
</template>

<style>
.ios-video-video {
  width: 100%;
  height: auto;
  max-height: 100%;
  margin: auto;
}
</style>

<script>
/* eslint no-console: "off" */
import {
  defineComponent,
  getCurrentInstance,
  onUnmounted,
  onMounted,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'IosVideo',
  setup() {
    const router = useRouter();
    const store = useStore();
    const video = ref(null);

    let exiting = false;
    const exit = () => {
      if (!exiting) {
        exiting = true;
        router.go(-1);
      }
    };

    onMounted(() => {
      const instance = getCurrentInstance();

      // This might happen after a reload. Go back.
      if (!store.state.currentVideo) {
        exit();
        return;
      }

      video.value.addEventListener("webkitendfullscreen", () => {
        exit();
      });

      // Need to wait for canplay when requesting full screen.
      video.value.addEventListener('canplay', () => {
        video.value.webkitEnterFullScreen();
      });

      // start playing.
      video.value.src = store.state.currentVideo.src;

    });

    onUnmounted(() => {
      // Clean up video after unmount.
      try {
        video.value.pause();
        video.value.src = '';
        video.value.load();
        if (window.video) {
          window.video = null;
        }
      } catch (err) { /* ignore */ }
    });

    return {
      video,
    };
  },
});
</script>
