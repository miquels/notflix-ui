iosNative,
<template>
  <teleport to="body">
    <div v-if="iosNative && playerInfo" class="ios-player-container z-top" draggable="false">
      <IosVideo :player-info="playerInfo"/>
    </div>
    <div v-if="!iosNative && playerInfo" class="local-player-container z-top" :style="fillAvailable">
      <Html5Video :player-info="playerInfo" end-video-go-back/>
    </div>
  </teleport>
</template>

<style>
.local-player-container {
  position: absolute;
  left: 0px;
  top: 0px;
  padding: 0px;
  margin: 0px;
  width: 100vw;
  height: 100vh;
  background-color: black;
}
.ios-player-container {
  display: flex;
  position: absolute;
  left: 0px;
  top: 0px;
  padding: 0px;
  margin: 0px;
  width: 100vw;
  height: 100vh;
  background-color: black;
}
</style>

<script>
import {
  defineComponent,
  onBeforeMount,
  ref,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { PlayerInfoFactory } from '../lib/playerinfo.js';
import Html5Video from 'components/Html5Video.vue';
import IosVideo from 'components/IosVideo.vue';

export default defineComponent({
  name: 'PagePlayer',
  components: {
    Html5Video,
    IosVideo,
  },

  setup() {
    const router = useRouter();
    const store = useStore();
    const quasar = useQuasar();
    const platform = quasar.platform;
    const iosSafari = platform.is.safari && quasar.platform.is.ios;

    // https://allthingssmitty.com/2020/05/11/css-fix-for-100vh-in-mobile-webkit/
    // This will eventually change to 'height: stretch'.
    const fillAvailable = platform.is.mobile ? { 'max-height': '-webkit-fill-available' } : {};
    const iosNative = iosSafari && store.state.config.iosNativeVideo;
    const playerInfo = ref(null);

    onBeforeMount(async () => {
      const factory = new PlayerInfoFactory(quasar, store);
      playerInfo.value = await factory.fromRoute(router.currentRoute.value);
    });

    return {
      fillAvailable,
      iosNative,
      playerInfo,
    };
  },
});
</script>
