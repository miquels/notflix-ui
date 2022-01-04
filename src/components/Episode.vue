<template>
  <div class="row episode-container">
    <div class="col-auto episode-left">
      <img :src="episode.thumb">
    </div>
    <div class="col episode-middle">
      <div class="row">
        <div class="col-12">
          <q-icon name="play_circle" size="24px" class="on-left" @click="$emit('play')"/>
          <span>{{ episode.name }}</span><span>{{ episode.title }}</span>
        </div>
        <div class="col-12">
          {{ episode.plot }}
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
}
.episode-left {
}
.episode-middle {
}
.episode-right {
}
</style>

<script>
import {
  defineComponent,
} from 'vue';

export default defineComponent({
  name: 'Episode',

  props: {
    episode: Object,
  },

});
</script>
