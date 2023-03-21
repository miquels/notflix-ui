<template>
  <div class="movie-container q-pt-md">
    <div class="movie-header">
      <Backdrop :poster="poster" :fanart="fanart"/>
      <div class="row text-h4 q-mb-md">
        <div class="col stroke">{{ title }}</div>
      </div>
      <div class="row q-my-md">
        <div class="col movie-plot">{{ plot }}
         </div>
        <div class="col-2 col-sm-6"></div>
      </div>
      <div class="row">
        <div class="col">
          <template v-for="(item, index) in nameValues" :key="index">
          <div class="table-row">
            <div class="table-cell q-pr-md">{{ item.name }}</div>
            <div class="table-cell">{{ item.value }}</div>
          </div>
          </template>
        </div>
        <div class="col-2 col-sm-6"></div>
      </div>
    </div>
    <div class="row q-my-md">
      <div class="col">
        <q-btn
          size="lg"
          color="blue"
          text-color="grey-5"
          icon="play_arrow"
          label="Play"
          class="movie-play"
          @click="playMovie"
          v-autofocus
        />
      </div>
    </div>
  </div>
</template>

<style>
.movie-container {
  position: relative;
  /*
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  */
  font-family: sans-serif;
  font-weight: 500;
  font-size: 1.1em;
  max-width: 1000px;
  margin: 0 auto;
}
.movie-header {
  position: relative;
  min-height: 60vh;
}
.movie-header-img {
  position: absolute;
  left: calc(30% + 0.2px);
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
  background-color: #000000;
  background-size: cover;
}
.movie-plot {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  white-space: pre-wrap;
}
.movie-play {
  color: #111111;
}
.movie-play:hover {
  color: #ffffff !important;
}
movie-play:focus {
  color: #ffffff !important;
  outline: solid red 2px !important;
}
.table {
  display: table;
}
.table-cell {
  display: table-cell;
}
.table-row {
  display: table-row;
}
</style>

<script>
import {
  defineComponent,
  inject,
  onBeforeMount,
  onMounted,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useApi } from '../lib/api.js';
import { hhmm } from '../lib/util.js';
import Backdrop from 'components/Backdrop.vue';

export default defineComponent({
  name: 'Movie',

  props: {
    collection: String,
    id: String,
  },

  components: {
    Backdrop,
  },

  setup(props) {

    const emitter = inject('emitter');
    const store = useStore();
    const router = useRouter();
    const api = useApi();

    const fanart = ref(null);
    const poster = ref(null);
    const nameValues = ref(null);
    const title = ref(null);
    const plot = ref(null);

    let movie;

    onBeforeMount(async () => {
      try {
        await api.getMovie(props.collection, props.id);
      } catch(e) {
        console.log('api.getMovie', props.collection, props.id, ': ', e);
      }
      console.log('onBeforeMount done');
    });

    onMounted(async () => {
      const item = await api.getMovie(props.collection, props.id);
      // console.log(item);

      movie = item;

      fanart.value = item.fanart || '#';
      poster.value = item.poster || '#';
      title.value = item.nfo.title;
      plot.value = item.nfo.plot;

      console.log(item);
      const nv = [];
      if (item.nfo.genre) {
        nv.push({ name: 'Genre:', value: item.nfo.genre.join(', ') });
      }
      if (item.year) {
        nv.push({ name: 'Year:', value: item.year });
      }
      if (item.nfo.runtime && item.nfo.runtime !== '0') {
        nv.push({ name: 'Runtime:', value: hhmm(item.nfo.runtime) });
      }
      if (item.nfo.rating) {
        nv.push({ name: 'Rating:', value: item.nfo.rating });
      }
      if (item.nfo.studio) {
        nv.push({ name: 'Studio:', value: item.nfo.studio });
      }
      // console.log(nv);
      nameValues.value = nv;
      console.log('onMounted done');
    });

    function playMovie() {
      // Chromecast?
      if (store.state.castState === 'connected') {
        const factory = new PlayerInfoFactory(quasar, store);
        const info = factory.episode(show, currentSeason, episode);
        emitter.emit('playCast', info);
      }

      // Nope, local player.
      router.push({
        name: 'movie-play',
        params: {
          collection: props.collection,
          id: props.id,
        },
      });
    }

    return {
      fanart,
      nameValues,
      playMovie,
      poster,
      plot,
      title,
    };
  },
});
</script>
