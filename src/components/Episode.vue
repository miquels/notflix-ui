<template>
  <div class="row episode-container">
    <div class="col-auto episode-left">
      <img :src="episode.thumb">
    </div>
    <div class="col episode-middle">
      <div class="row">
        <div class="col-12">
          <q-icon
            name="play_circle"
            size="72px"
            class="on-left q-pb-md"
            @click="$emit('play', episode.video)"
          />
          <span>{{ episode.name }}. {{ episode.nfo.title }}</span>
        </div>
        <div class="col-12 q-pt-md">
          {{ episode.nfo.plot }}
        </div>
      </div>
    </div>
    <div v-if="episode.aired || episode.duration" class="col-2 episode-end">
      <div class="row">
        <div class="col-12">
          {{ episode.aired }}
        </div>
        <div class="col-12">
          {{ episode.duration }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.episode-container {
  padding-top: 1em;
  padding-bottom: 1em;
}
.episode-left img {
  max-height: 100%;
}
.episode-middle {
}
.episode-right {
}
</style>

<script>
import {
  defineComponent,
  getCurrentInstance,
  onBeforeMount,
} from 'vue';

export default defineComponent({
  name: 'Episode',
  setup() {
    onBeforeMount(() => {
      const instance = getCurrentInstance();
      // console.log('episode onBeforeMount', instance.ctx.episode);
      console.log('fuck you eslint', instance.ctx);
    });
  },
  props: {
    episode: Object,
  },

});
</script>
