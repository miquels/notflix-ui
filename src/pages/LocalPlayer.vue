<template>
  <teleport to="body">
    <div class="local-player-container z-top" :style="fillAvailable">
      <Html5Video :src="src"/>
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
</style>

<script>
import {
  defineComponent,
} from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import Html5Video from 'components/Html5Video.vue';

export default defineComponent({
  name: 'PageLocalPlayer',
  components: {
    Html5Video,
  },

  setup() {
    const route = useRoute();
    const quasar = useQuasar();

    // https://allthingssmitty.com/2020/05/11/css-fix-for-100vh-in-mobile-webkit/
    // This will eventually change to 'height: stretch'.
    const fillAvailable = quasar.platform.is.mobile ? { 'max-height': '-webkit-fill-available' } : {};

    return {
      src: route.params.src,
      fillAvailable,
    };
  },
});
</script>
