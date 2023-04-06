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
    :src="currentVideo.src"
    @webkitendfullscreen="onEndFullScreen"
    @timeupdate="onTimeUpdate"
    @seeked="updateSeen"
    @loadedmetadata="onLoadedmetadata"
    @playing="goFullScreen('onPlaying')"
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
import { throttle } from 'quasar';
import {
  defineComponent,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';
import { toRefs } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '../lib/api.js';

const DBG = false;

export default defineComponent({
  name: 'IosVideo',
  props: {
    'player-info': Object,
    'end-video-go-back': Boolean,
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const api = useApi();
    const video = ref(null);
    const { playerInfo } = toRefs(props);
    const currentVideo = playerInfo.value;

    let exiting = false;
    const onEndFullScreen = () => {
      if (!exiting) {
        exiting = true;
        router.go(-1);
      }
    };

    const goFullScreen = (msg) => {
      if (!video.value.webkitDisplayingFullscreen) {
        try {
          if (DBG) console.log(`IosVideo: ${msg}: enter full screen`);
          video.value.webkitEnterFullScreen();
        } catch(err) {
          if (DBG) console.log(`IosVideo: ${msg}: failed to enter full screen`, err);
        }
      }
    };

    const onLoadedmetadata = () => {
      if (currentVideo.currentTime) {
        video.value.currentTime = currentVideo.currentTime;
      }
    };

    const updateSeen = (noRouteUpdate) => {
      if (!noRouteUpdate) {
        // Update URL in case of a reload, so we can continue.
        const newRoute = {
          path: route.path,
          query: { t: Math.floor(video.value.currentTime) },
        };
        router.replace(newRoute);
      }
      // And update stored value.
      api.updateSeen(currentVideo, video.value.currentTime, video.value.duration)
          .catch((e) => { if (DBG) console.log('failed to updateSeen: ', e) });
    };
    const onTimeUpdate = throttle(updateSeen, 5000);

    onMounted(() => {
      goFullScreen('onMounted');
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

      updateSeen(true);
    });

    return {
      currentVideo,
      goFullScreen,
      onEndFullScreen,
      onLoadedmetadata,
      onTimeUpdate,
      updateSeen,
      video,
    };
  },
});
</script>
