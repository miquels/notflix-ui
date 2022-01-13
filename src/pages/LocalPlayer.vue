<template>
    <div class="local-player-container flex-center fit">
      <Html5Video :src="src"/>
    </div>
</template>

<style>
.local-player-container {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
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
