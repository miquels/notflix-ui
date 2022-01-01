<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
      <div class="row">
        <div class="col">
          <VideoPlayer url="https://mx2.langeraar.net:1340/mike/data/tv-series/The%20Expanse/S06/the.expanse.s06e03.720p.web.h264-glhf.mp4/master.m3u8"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import VideoPlayer from 'components/VideoPlayer.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageIndex',
  components: {
    VideoPlayer,
  },
});
</script>
