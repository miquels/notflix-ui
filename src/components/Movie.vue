<template>
  <div class="movie-container q-pt-md">
    <div class="movie-header">
      <div class="movie-header-img" :style="bgImage()"/>
      <div class="row text-h4 q-mb-md">
        <div class="col">{{ title }}</div>
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
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  font-size: 1.2em;
  max-width: 1000px;
  margin: 0 auto;
}
.movie-header {
  position: relative;
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
import Config from '../lib/config.js';
import Api from '../lib/api.js';
import { joinpath } from '../lib/util.js';

function escapeHtml(html) {
  const text = document.createTextNode(html);
  const p = document.createElement('p');
  p.appendChild(text);
  return p.innerHTML;
}

function updateNfo(movie, nfo) {
  if (nfo.title) {
    nfo.title = escapeHtml(nfo.title);
  }
  if (nfo.plot) {
    nfo.plot = escapeHtml(nfo.plot);
  }
  if (nfo.thumb) {
    nfo.thumb = joinpath(movie.path, nfo.thumb);
  }
}

function updateMovie(apiUrl, theMovie) {
  console.log('updateMovie', apiUrl, theMovie);
  const movie = JSON.parse(JSON.stringify(theMovie));
  movie.name = escapeHtml(movie.name);
  movie.path = joinpath(apiUrl, movie.baseurl, movie.path);
  console.log('movie.path us now', movie.path);
  updateNfo(movie, movie.nfo);
  if (movie.banner) movie.banner = joinpath(movie.path, movie.banner);
  if (movie.fanart) movie.fanart = joinpath(movie.path, movie.fanart);
  if (movie.poster) movie.poster = joinpath(movie.path, movie.poster);
  if (movie.video) {
    movie.video = joinpath(movie.path, movie.video);
    movie.video = Config.fixupMovieUrl(movie.video);
  }
  console.log('movie is now xyzzy', movie);
  return movie;
}

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

    const config = new Config();
    const api = new Api({ url: config.apiUrl });
    return {
      fanart: ref(null),
      poster: ref(null),
      nameValues: ref(null),
      title: ref(null),
      plot: ref(null),
      bgimage: ref(null),
      movie: ref(null),
      api,
      apiUrl: config.apiUrl,
      emitter,
      store,
    };
  },

  methods: {
    on_mounted() {
      this.api.getMovie(this.collection, this.name).then((item) => {
        console.log(item);
        this.movie = updateMovie(this.apiUrl, item);
        if (!this.movie.fanart && this.movie.poster) {
          this.movie.fanart = this.movie.poster;
        }
        if (!this.movie.poster && this.movie.fanart) {
          this.movie.poster = this.movie.fanart;
        }
        if (!this.movie.fanart) this.movie.fanart = '#';
        if (!this.movie.poster) this.movie.poster = '#';
        this.bgimage = this.movie.fanart;
        console.log('setting bgimage to', this.bgimage);
        this.title = this.movie.nfo.title;
        this.plot = this.movie.nfo.plot;
        console.log(this.movie);
        const nv = [];
        if (this.movie.nfo.genre) {
          nv.push({ name: 'Genre:', value: this.movie.nfo.genre.join(', ') });
        }
        if (this.movie.year) {
          nv.push({ name: 'Year:', value: this.movie.year });
        }
        if (this.movie.nfo.rating) {
          nv.push({ name: 'Rating:', value: this.movie.nfo.rating });
        }
        console.log(nv);
        this.nameValues = nv;
      });
    },

    bgImage() {
      const style = {
        backgroundImage:
          `linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%), url(${this.bgimage})`,
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
      const url = this.movie.video;
      console.log('playMovie', url, this.store.state.castState);
      if (this.store.state.castState === 'connected') {
        this.emitter.emit('playCast', url);
      } else {
        this.$router.push(`/local-player/${url}`);
      }
    },
  },
});
</script>
