<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
      <div class="row">
        <div class="col">
          <VideoPlayer :url="url" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import VideoPlayer from 'components/VideoPlayer.vue';
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
      instance.ctx.updateUrl('https://mx2.high5.nl/data/tv-series/The%20Expanse/S06/the.expanse.s06e03.720p.web.h264-glhf.mp4');
    });
    return {
      videoPlayer: ref(null),
      url: ref(null),
    };
  },
  components: {
    VideoPlayer,
  },
  methods: {
    updateUrl(url) {
      this.url = url;
    },
  },
});
</script>
