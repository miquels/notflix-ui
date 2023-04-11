<template>
  <div class="row justify-center" v-autofocus>
  <Backdrop v-if="$q.platform.is.tv" :poster="poster" :fanart="fanart"/>
  <div class="col-12 col-sm-10">

  <div class="movie-container q-pt-md">
    <div class="movie-header column q-ms-md">
      <Backdrop v-if="!$q.platform.is.tv" :poster="poster" :fanart="fanart"/>

        <div class="col">
          <div class="row text-h4 q-mb-md">
            <div class="col stroke">{{ title }}</div>
          </div>
       </div>

        <div class="col">
          <div class="row q-my-md">
            <div class="col-12 col-sm-6 movie-plot">{{ plot }}</div>
            <div class="col-12 col-sm-6"/>
          </div>
        </div>

        <div class="col-auto">

          <div class="row">
            <div class="col-12">
              <template v-for="(item, index) in nameValues" :key="index">
              <div class="table-row">
                <div class="table-cell q-pr-md">{{ item.name }}</div>
                <div class="table-cell">{{ item.value }}</div>
              </div>
              </template>
            </div>
          </div>

          <div class="row q-mb-sm q-mt-md">
              <div class="col-auto movie-button no-outline">
                <q-btn
                  size="lg"
                  color="blue"
                  text-color="grey-5"
                  icon="play_arrow"
                  :label="progress ? 'Resume' : 'Play'"
                  class="movie-play no-outline"
                  @click="playMovie"
                  v-focus="10"
                />
                <q-linear-progress
                  v-if="progress != null && $q.platform.is.tv"
                  :value="progress"
                  rounded
                  instant-feedback
                  color="red-14"
                  class="movie-progress"
                />
              </div>
          </div>

          <div class="row">
            <div class="col-12">
                <q-linear-progress
                v-if="progress != null && !$q.platform.is.tv"
                :value="progress"
                rounded
                instant-feedback
                color="red-14"
                class="q-mt-sm movie-progress"
                />
              </div>
          </div>
        </div>

    </div>
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
  min-height: 100%;
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
.movie-play:focus {
  color: #ffffff !important;
}
.movie-progress {
  background: $grey-6 !important;
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
import { useQuasar } from 'quasar';
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
    const progress = ref(null);

    let movie;

    onBeforeMount(async () => {
      try {
        await api.getMovie(props.collection, props.id);
      } catch(e) {
        console.log('Movie: api.getMovie', props.collection, props.id, ': ', e);
      }
      console.log('Movie: onBeforeMount done');
    });

    onMounted(async () => {
      const item = await api.getMovie(props.collection, props.id);
      // console.log(item);

      movie = item;

      fanart.value = item.fanart || '#';
      poster.value = item.poster || '#';
      title.value = item.nfo.title;
      plot.value = item.nfo.plot;

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

      if (movie.seen) {
        progress.value = movie.seen.currentTime / movie.seen.duration;
      }
      console.log('Movie: onMounted done');
    });

    function playMovie() {
      // Mark movie as favorite, so that we can resume from Favorites.
      api.setFavorite(movie.id, true);

      // Chromecast?
      if (store.state.castState === 'connected') {
        const factory = new PlayerInfoFactory(quasar, store);
        const info = factory.movie(movie);
        emitter.emit('playCast', info);
        return;
      }

      // Nope, local player.
      const to = {
        name: 'movie-play',
        params: {
          collection: props.collection,
          id: props.id,
        },
      };
      if (movie.seen) {
        to.query = { t: Math.floor(movie.seen.currentTime) };
      }
      router.push(to);
    }

    return {
      fanart,
      nameValues,
      playMovie,
      poster,
      plot,
      progress,
      title,
    };
  },
});
</script>
