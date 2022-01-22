<template>
  <div class="movie-container q-pt-md">
    <div class="movie-header">
      <div class="movie-header-img" :style="bgImage()"/>
      <div class="row text-h4 q-mb-md">
        <div class="col stroke">{{ title }}</div>
      </div>
      <div class="row q-my-md">
        <div class="col">{{ plot }}
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
        <q-btn size="lg" color="blue" icon="play_arrow" label="Play" @click="playMovie" />
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
  font-size: 1.2em;
  max-width: 1000px;
  margin: 0 auto;
}
.movie-header {
  position: relative;
  min-height: 250px;
}
.movie-header-img {
  position: absolute;
  left: 40%;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
  background-color: #000000;
  background-size: cover;
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
  getCurrentInstance,
  inject,
  onBeforeMount,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import Api from '../lib/api.js';
import { hhmm } from '../lib/util.js';

export default defineComponent({
  name: 'Movie',

  props: {
    collection: String,
    name: String,
  },

  setup() {
    onBeforeMount(() => {
      const instance = getCurrentInstance();
      instance.ctx.on_mounted();
    });

    const emitter = inject('emitter');
    const store = useStore();

    const api = new Api();
    return {
      fanart: ref(null),
      poster: ref(null),
      nameValues: ref(null),
      title: ref(null),
      plot: ref(null),
      bgimage: ref(null),
      movie: ref(null),
      currentVideo: ref(null),
      api,
      emitter,
      store,
    };
  },

  methods: {
    on_mounted() {
      this.api.getMovie(this.collection, this.name).then((item) => {
        // console.log(item);
        this.movie = item;
        if (!this.movie.fanart && this.movie.poster) {
          this.movie.fanart = this.movie.poster;
        }
        if (!this.movie.poster && this.movie.fanart) {
          this.movie.poster = this.movie.fanart;
        }
        this.bgimage = this.movie.fanart ? this.movie.fanart : '/img/static.jpg';
        if (!this.movie.fanart) this.movie.fanart = '#';
        if (!this.movie.poster) this.movie.poster = '#';
        // console.log('setting bgimage to', this.bgimage);
        this.title = this.movie.nfo.title;
        this.plot = this.movie.nfo.plot;
        // console.log(this.movie);
        const nv = [];
        if (this.movie.nfo.genre) {
          nv.push({ name: 'Genre:', value: this.movie.nfo.genre.join(', ') });
        }
        if (this.movie.year) {
          nv.push({ name: 'Year:', value: this.movie.year });
        }
        if (this.movie.nfo.runtime && this.movie.nfo.runtime !== '0') {
          nv.push({ name: 'Runtime:', value: hhmm(this.movie.nfo.runtime) });
        }
        if (this.movie.nfo.rating) {
          nv.push({ name: 'Rating:', value: this.movie.nfo.rating });
        }
        if (this.movie.nfo.studio) {
          nv.push({ name: 'Studio:', value: this.movie.nfo.studio });
        }
        // console.log(nv);
        this.nameValues = nv;
      });
    },

    bgImage() {
      const img = `${this.bgimage}?q=90&h=250`;
      const style = {
        backgroundImage:
          `linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%), url(${img})`,
      };
      return style;
    },

    onResize(ev) {
      console.log(ev);
      if (this.movie && (1.8 * ev.height > ev.width)) {
        this.bgimage = this.movie.poster;
      } else {
        this.bgimage = this.movie.fanart;
      }
    },

    playMovie() {
      this.emitter.emit('playVideo', { type: 'movie', movie: this.movie });
    },
  },
});
</script>
