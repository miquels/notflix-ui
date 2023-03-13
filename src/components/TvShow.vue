<template>
  <lrud no-scroll-into-view>
  <div class="tv-show-container q-pt-md">
    <div class="row justify-center">
    <div class="col-12 col-sm-10 tv-show-inner">
    <div class="tv-show-header">
      <q-resize-observer @resize="onResize"/>
      <div class="tv-show-header-img" :style="bgImage()"/>
      <div class="row text-h3 q-mb-md">
        <div class="col stroke">{{ title }}</div>
      </div>
      <div class="row text-h6">
        <div class="col" v-if="seasons && currentSeason">
          <q-item @focusin="scrollToTop" class="col-xs-8 col-sm-auto relative q-pa-none">
          <div v-if="seasons.length === 1">
            {{ currentSeason.name }}
          </div>
          <lrud no-scroll-into-view v-if="seasons.length > 1" no-nav-inside steal-keys-outside>
          <q-select
              filled
              dense
              options-dense
              :options="seasons"
              option-label="name"
              v-model="currentSeason"
              style="width=100%"
              options-selected-class="q-select-active-option"
              v-autofocus="'input'"
          />
          </lrud>
          </q-item>
        </div>
      </div>
      <div class="row q-my-md">
        <div class="col tvshow-plot">{{ plot }}
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
    <div v-if="seasons && currentSeason" class="tv-show-episodes">
      <template v-for="(episode, index) in currentSeason.episodes" :key="episode.name">
        <Episode 
          v-autofocus="{ v_if: seasons.length === 1 && index === 0, selector: '.q-icon' }"
          :episode="episode"
          @play="playEpisode(episode)"
          @focusin="scrollIntoView($event, index)"
        />
      </template>
    </div>
  </div>
  </div>
  </div>
  </lrud>
</template>

<style lang="scss">
.tv-show-container {
  position: relative;
  /*
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  */
  font-family: sans-serif;
  font-weight: 500;
  font-size: 1.1em;
  margin: 0 auto;
  height: calc(100vh - 75px);
  overflow-x: hidden;
  overflow-y: scroll;
}
.tv-show-inner {
  max-width: 1000px;
}
.tv-show-header {
  position: relative;
}
.tv-show-header-img {
  position: absolute;
  // Chrome has a bug where a linear gradient over a background image
  // sometimes leaves an artifact of about 1 pixel. This seems to happen
  // when the size is not (near) an integer number of pixels. The below
  // is somewhat of a workaround, at least for 1280x720 (TV).
  // See:
  // https://stackoverflow.com/questions/64436505/linear-gradient-not-covering-whole-image-leaves-1px-border
  //
  left: calc(40% + 0.2px);
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
  background-color: #000000;
  background-size: cover;
}
.tvshow-plot {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  white-space: pre-wrap;
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
    const api = new Api();
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
      currentSeason: ref(null),
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
        if (this.show.nfo.studio) {
          nv.push({ name: 'Studio:', value: this.show.nfo.studio });
        }
        if (this.show.nfo.rating) {
          nv.push({ name: 'Rating:', value: this.show.nfo.rating });
        }
        if (this.show.nfo.mpaa) {
          nv.push({ name: 'MPAA:', value: this.show.nfo.mpaa });
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
        this.currentSeason = this.seasons[0];
      });
    },

    bgImage() {
      if (!this.bgimage) {
        return {};
      }
      const ratio = window.devicePixelRatio * window.outerWidth / window.innerWidth;
      const height = Math.trunc(250 * ratio);
      const img = `${this.bgimage}?q=90&h=${height}`;
      const style = {
        backgroundImage:
          `linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0,0,0, 0.7) 20%, rgba(0, 0, 0, 0) 50%), url(${img})`,
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
      const seasonIdx = this.currentSeason.idx;
      const season = this.show.seasons[seasonIdx];
      const { show } = this;
      this.emitter.emit('playVideo', {
        type: 'episode',
        show,
        season,
        episode,
      });
    },

    scrollIntoView(ev, epIndex) {
      if (epIndex === 0) {
        this.scrollToTop();
        return;
      }
      ev.currentTarget.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    },

    scrollToTop() {
      this.$el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    },
  },
});
</script>
