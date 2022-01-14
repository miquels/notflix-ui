<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
      <div class="row">
        <div class="col-12 window-width">
          <Chromecast :src="src" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import Chromecast from 'components/Chromecast.vue';
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  ref,
} from 'vue';

export default defineComponent({
  name: 'PageIndex',
  setup() {
    onMounted(() => {
      const instance = getCurrentInstance();
      const src = config.samples[0];
      console.log('updating src to', src);
      instance.ctx.src = src;
    });
    return {
      src: ref(config.samples[0]),
    };
  },
  components: {
    Chromecast,
  },
});
</script>
