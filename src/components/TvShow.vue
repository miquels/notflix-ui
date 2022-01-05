<template>
  <div class="tv-show-container q-pt-md">
  <q-resize-observer @resize="onResize"/>
    <div class="tv-show-header">
      <div class="tv-show-header-img" :style="bgImage()"/>
      <div class="row text-h4 q-mb-md">
        <div class="col">{{ title }}</div>
      </div>
      <div class="row text-h6">
        <div class="col" v-if="show">
          <q-btn-dropdown
            class="tv-show-season-menu"
            :label="`Season ${show.seasons[currentSeason].seasonno}`"
          >
            <q-list v-if="show">
              <template v-for="(season, index) in show.seasons" :key="season.name">
                <q-item clickable v-close-popup @click="currentSeason = index">
                  <q-item-section>
                    <q-item-label>Season {{season.seasonno}}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-btn-dropdown>
        </div>
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
    <div v-if="show && show.seasons && show.seasons[currentSeason]" class="tv-show-episodes">
      <template v-for="episode in show.seasons[currentSeason].episodes" :key="episode.name">
        <Episode :episode="episode" @play="playEpisode"/>
      </template>
    </div>
  </div>
</template>

<style>
.tv-show-container {
  position: relative;
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  font-size: 1.2em;
  max-width: 1000px;
  margin: 0 auto;
}
.tv-show-header {
  position: relative;
}
.tv-show-header-img {
  position: absolute;
  left: 40%;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
  background-color: #000000;
  background-size: cover;
}
.tv-show-season-menu {
  background: #444466;
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
  onBeforeMount,
  ref,
} from 'vue';
import Config from '../lib/config.js';
import Api from '../lib/api.js';
import { joinpath } from '../lib/util.js';
import Episode from './Episode.vue';

function escapeHtml(html) {
  const text = document.createTextNode(html);
  const p = document.createElement('p');
  p.appendChild(text);
  return p.innerHTML;
}

function updateNfo(show, nfo) {
  if (nfo.title) {
    nfo.title = escapeHtml(nfo.title);
  }
  if (nfo.plot) {
    nfo.plot = escapeHtml(nfo.plot);
  }
  if (nfo.thumb) {
    nfo.thumb = joinpath(show.path, nfo.thumb);
  }
}

function updateEpisode(show, episode) {
  updateNfo(show, episode.nfo);
  if (episode.thumb) episode.thumb = joinpath(show.path, episode.thumb);
  if (episode.video) {
    episode.video = joinpath(show.path, episode.video);
    episode.video = Config.fixupEpisodeUrl(episode.video);
  }
}

function updateShow(apiUrl, theShow) {
  console.log('updateShow', apiUrl, theShow);
  const show = JSON.parse(JSON.stringify(theShow));
  show.name = escapeHtml(show.name);
  show.path = joinpath(apiUrl, show.baseurl, show.path);
  console.log('show.path us now', show.path);
  updateNfo(show, show.nfo);
  if (show.banner) show.banner = joinpath(show.path, show.banner);
  if (show.fanart) show.fanart = joinpath(show.path, show.fanart);
  if (show.poster) show.poster = joinpath(show.path, show.poster);
  console.log('aaa, now path and fanart', show.path, show.fanart);
  if (show.seasonAllBanner) {
    show.seasonAllBanner = joinpath(show.path, show.seasonAllBanner);
  }
  if (show.seasonAllPoster) {
    show.seasonAllPoster = joinpath(show.path, show.seasonAllPoster);
  }
  // eslint-disable-next-line
  for (const season of show.seasons) {
    if (season.poster) {
      season.poster = joinpath(show.path, season.poster);
    }
    // eslint-disable-next-line
    for (const episode of season.episodes) {
      updateEpisode(show, episode);
    }
  }
  console.log('show is now xyzzy', show);
  return show;
}

export default defineComponent({
  name: 'TvShow',

  props: {
    collection: String,
    name: String,
  },

  components: {
    Episode,
  },

  setup() {
    onBeforeMount(() => {
      const instance = getCurrentInstance();
      instance.ctx.on_mounted();
    });
    const config = new Config();
    const api = new Api({ url: config.apiUrl });
    return {
      fanart: ref(null),
      poster: ref(null),
      nameValues: ref(null),
      title: ref(null),
      plot: ref(null),
      bgimage: ref(null),
      show: ref(null),
      currentSeason: ref(0),
      api,
      apiUrl: config.apiUrl,
    };
  },

  methods: {
    on_mounted() {
      this.api.getShow(this.collection, this.name).then((item) => {
        console.log(item);
        this.show = updateShow(this.apiUrl, item);
        if (!this.show.fanart && this.show.poster) {
          this.show.fanart = this.show.poster;
        }
        if (!this.show.poster && this.show.fanart) {
          this.show.poster = this.show.fanart;
        }
        if (!this.show.fanart) this.show.fanart = '#';
        if (!this.show.poster) this.show.poster = '#';
        this.bgimage = this.show.fanart;
        console.log('setting bgimage to', this.bgimage);
        this.title = this.show.nfo.title;
        this.plot = this.show.nfo.plot;
        console.log(this.show);
        const nv = [];
        if (this.show.nfo.genre) {
          nv.push({ name: 'Genre:', value: this.show.nfo.genre.join(', ') });
        }
        if (this.show.year) {
          nv.push({ name: 'Year:', value: this.show.year });
        }
        if (this.show.nfo.rating) {
          nv.push({ name: 'Rating:', value: this.show.nfo.rating });
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
      if (this.show && this.show.poster && this.show.fanart) {
        if (1.8 * ev.height > ev.width) {
          this.bgimage = this.show.poster;
        } else {
          this.bgimage = this.show.fanart;
        }
      }
    },

    playEpisode(url) {
      console.log('playEpisode', url);
      this.$router.push(`/local-player/${url}`);
    },
  },
});
</script>
