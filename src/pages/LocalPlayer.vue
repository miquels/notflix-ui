<template>
  <teleport to="body">
    <div class="local-player-container z-top">
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
import { useRoute } from 'vue-router';
import Html5Video from 'components/Html5Video.vue';

export default defineComponent({
  name: 'PageLocalPlayer',
  components: {
    Html5Video,
  },

  setup() {
    const route = useRoute();
    console.log('params:', route.params);
    return {
      src: route.params.src,
    };
  },
});
</script>
