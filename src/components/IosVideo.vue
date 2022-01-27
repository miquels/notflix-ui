// IosVideo.vue
//
// Used for iPhone (or iPad) where it's really hard to
// build a video player with custom controls.
//
<template>
  <video
    controls
    autoplay
    draggable="false"
    class="ios-video-video"
    v-touch-swipe.mouse.right="() => exit()"
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

    onMounted(() => {
      const instance = getCurrentInstance();

      // This might happen after a reload. Go back.
      if (!store.state.currentVideo) {
        instance.ctx.exit();
      }

      // Edge trigger. fullscreen -> not fullscreen: exit.
      let isFullScreen = video.value.webkitDisplayingFullscreen;
      const timer = () => {
        const v = video.value;
        if (!v || (isFullScreen && !v.webkitDisplayingFullscreen)) {
          instance.ctx.exit();
        }
        isFullScreen = v.webkitDisplayingFullscreen;
        setTimeout(timer, 1000);
      };
      timer();

      // start playing.
      video.value.src = store.state.currentVideo.src;
    });

    onUnmounted(() => {
      const instance = getCurrentInstance();
      // Clean up after unmount. Not sure if this is neccesary.
      try {
        if (instance.ctx.video) {
          instance.ctx.video.src = '';
          instance.ctx.video.load();
          instance.ctx.video = null;
        }
      } catch (err) { /* ignore */ }
    });

    return {
      video,
      store,
      router,
      exiting: false,
    };
  },

  methods: {
    exit() {
      this.msg += 'exit\n';
      if (!this.exiting) {
        this.exiting = true;
        this.router.go(-1);
      }
    },
  },
});
</script>
