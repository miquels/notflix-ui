<template>
  <div class="row items-stretch episode-container" :data-episode="episode.episodeno">
    <div class="col-xs-12 col-md-3 episode-left">
      <Image :src="episode.thumb" :progress="episode.progress" errorSrc="/img/static.jpg" />
    </div>
    <div class="col-xs-12 col-md-9 episode-middle q-px-md">
      <div class="row">
        <div class="col-12 q-pt-sm">
          <div class="row">
          <q-icon
            name="play_circle"
            size="48px"
            class="episode-play col-auto on-left no-outline"
            @click="$emit('play', episode)"
            tabindex="0"
          />
          <div class="col" style="margin: auto">
            {{ episode.name }}. {{ episode.nfo.title }}
          </div>
          </div>
        </div>
        <div class="col-12 q-pt-md episode-plot">
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

<style lang="scss">
.episode-container {
  margin-top: 1em;
  margin-bottom: 1em;
  background: #19192c;
  position: relative;
}
.episode-container:focus-within, .episode-container:hover {
  background: #282835;
}
.episode-left {
  background: black;
}
.episode-left img {
  width: 100%;
  height: 100%;
}
.episode-plot {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  white-space: pre-wrap;
}
.episode-middle {
}
.episode-right {
}
.episode-play {
  color: #dddddd;
}
.episode-play:hover {
  color: #ffffff;
  cursor: pointer;
}
.episode-play:focus {
  color: #ffffff;
}
</style>

<script setup>
import Image from 'components/Image.vue';

const { episode } = defineProps({ episode: Object });
//const { episode } = toRefs(props);
function thumb() {
  return episode.thumb || '/img/static.jpg';
}
</script>
