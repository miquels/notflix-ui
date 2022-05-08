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
  onBeforeUnmount,
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
      window.video = video.value;

      video.value.addEventListener("webkitendfullscreen", () => {
        exit();
      });

      // Need to wait for canplay when requesting full screen.
      video.value.addEventListener('canplay', () => {
        try {
          video.value.webkitEnterFullScreen();
        } catch(err) { /* ignore */}
      });

      // Or maybe, when the video starts playing.
      video.value.addEventListener('timeupdate', () => {
        if (!video.value.webkitDisplayingFullscreen) {
          try {
            video.value.webkitEnterFullScreen();
          } catch(err) { /* ignore */}
        }
      }, { once: true });

      // start playing.
      video.value.src = store.state.currentVideo.src;

    });

    onBeforeUnmount(() => {
      // Clean up video before unmount.
      //
      // It needs to be before, so any airplay session will stop as well.
      // Unfortunately, airplay remains sort of connected, so when you
      // play another video, it will re-connect to the airplay target :(
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
