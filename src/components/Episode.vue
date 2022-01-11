<template>
  <div class="row items-stretch episode-container">
    <div class="col-xs-12 col-md-3 episode-left">
      <img :src="thumb()" onerror="this.src='/img/static.jpg'">
    </div>
    <div class="col-xs-12 col-md-9 episode-middle q-px-md">
      <div class="row">
        <div class="col-12">
          <q-icon
            name="play_circle"
            size="72px"
            class="episode-play on-left q-pb-md"
            @click="$emit('play', episode)"
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
  margin-top: 1em;
  margin-bottom: 1em;
  background: #333333;
  position: relative;
}
.episode-left {
  background: black;
}
.episode-left img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.episode-middle {
}
.episode-right {
}
.episode-play:hover {
  cursor: pointer;
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
  methods: {
    thumb() {
      return this.episode.thumb || '/img/static.jpg';
    },
  },
});
</script>
