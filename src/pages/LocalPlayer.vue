<template>
  <div class="allout">
    <Html5Video :src="src"/>
  </div>
</template>

<style>
.allout {
  width: 100%;
  height: 100%;
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
