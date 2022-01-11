<template>
  <div class="tv-show-container q-pt-md">
    <div class="tv-show-header">
      <q-resize-observer @resize="onResize"/>
      <div class="tv-show-header-img" :style="bgImage()"/>
      <div class="row text-h4 q-mb-md">
        <div class="col">{{ title }}</div>
      </div>
      <div class="row text-h6">
        <div class="col" v-if="seasons && seasons[currentSeason]">
          <div v-if="seasons.length === 1">{{ seasons[currentSeason].name }}</div>
          <q-btn-dropdown
            v-else
            class="tv-show-season-menu"
            :label="seasons[currentSeason].name"
          >
            <q-list v-if="show">
              <template v-for="(season, index) in seasons" :key="season.name">
                <q-item clickable v-close-popup @click="currentSeason = index">
                  <q-item-section>
                    <q-item-label>{{ season.name }}</q-item-label>
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
    <div v-if="seasons && seasons[currentSeason]" class="tv-show-episodes">
      <template v-for="episode in seasons[currentSeason].episodes" :key="episode.name">
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
  inject,
  onBeforeMount,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import Config from '../lib/config.js';
import Api from '../lib/api.js';
import Episode from './Episode.vue';

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
    const store = useStore();
    const emitter = inject('emitter');
    return {
      fanart: ref(null),
      poster: ref(null),
      nameValues: ref(null),
      title: ref(null),
      plot: ref(null),
      bgimage: ref(null),
      show: ref(null),
      seasons: ref([]),
      currentSeason: ref(0),
      playVideo: ref(null),
      api,
      store,
      emitter,
    };
  },

  methods: {
    on_mounted() {
      this.api.getShow(this.collection, this.name).then((item) => {
        this.show = item;
        console.log('show:', item);

        if (!this.show.fanart && this.show.poster) {
          this.show.fanart = this.show.poster;
        }
        if (!this.show.poster && this.show.fanart) {
          this.show.poster = this.show.fanart;
        }
        if (!this.show.fanart) this.show.fanart = '#';
        if (!this.show.poster) this.show.poster = '#';
        this.bgimage = this.show.fanart;
        console.log('bgimage:', this.bgimage);

        this.title = this.show.nfo.title;
        this.plot = this.show.nfo.plot;

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
        this.nameValues = nv;

        this.seasons = [];
        for (let i = 0; i < this.show.seasons.length; i += 1) {
          const { seasonno } = this.show.seasons[i];
          const { episodes } = this.show.seasons[i];
          if (seasonno === 0) {
            this.seasons.push({
              name: 'Extras',
              idx: i,
              episodes,
              prio: 99999,
            });
          } else {
            this.seasons.push({
              name: `Season ${seasonno}`,
              idx: i,
              episodes,
              prio: seasonno,
            });
          }
        }
        this.seasons.sort((a, b) => a.prio - b.prio);
      });
    },

    bgImage() {
      if (!this.bgimage) {
        return {};
      }
      const style = {
        backgroundImage:
          `linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%), url(${this.bgimage})`,
      };
      return style;
    },

    onResize(ev) {
      console.log(ev);
      if (this.show && this.show.poster && this.show.fanart) {
        if (ev.height > ev.width) {
          this.bgimage = this.show.poster;
        } else {
          this.bgimage = this.show.fanart;
        }
      }
    },

    playEpisode(episode) {
      const seasonIdx = this.seasons[this.currentSeason].idx;
      const season = this.show.seasons[seasonIdx];
      const { show } = this;
      this.emitter.emit('playVideo', {
        type: 'episode',
        show,
        season,
        episode,
      });
    },
  },
});
</script>
