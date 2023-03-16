<template>
  <lrud no-scroll-into-view ref="el">
  <div class="tv-show-container q-pt-md">
    <div class="row justify-center">
    <div class="col-12 col-sm-10 tv-show-inner">
    <div class="tv-show-header">
      <Backdrop :poster="poster" :fanart="fanart"/>
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

<script setup>
import {
  inject,
  onBeforeMount,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useApi } from '../lib/api.js';
import Backdrop from './Backdrop.vue';
import Episode from './Episode.vue';
import { PlayerInfoFactory } from '../lib/playerinfo.js';

const props = defineProps({
  collection: String,
  name: String,
  details: String,
});

const emitter = inject('emitter');
const api = useApi();
const store = useStore();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();

let show;
let fanart;
let poster;
let nameValues;
let title;
let plot;
const seasons = [];

const el = ref(null);
const currentSeason = ref(null);

async function getShow() {

  const item = await api.getShow(props.collection, props.name);
  show = { ...item };

  fanart = show.fanart;
  poster = show.poster;
  title = show.nfo.title;
  plot = show.nfo.plot;

  const nv = [];
  if (show.nfo.genre) {
    nv.push({ name: 'Genre:', value: show.nfo.genre.join(', ') });
  }
  if (show.year) {
    nv.push({ name: 'Year:', value: show.year });
  }
  if (show.nfo.studio) {
    nv.push({ name: 'Studio:', value: show.nfo.studio });
  }
  if (show.nfo.rating) {
    nv.push({ name: 'Rating:', value: show.nfo.rating });
  }
  if (show.nfo.mpaa) {
    nv.push({ name: 'MPAA:', value: show.nfo.mpaa });
  }
  nameValues = nv;

  for (let i = 0; i < show.seasons.length; i += 1) {
    const { seasonno } = show.seasons[i];
    const { episodes } = show.seasons[i];
    if (seasonno === 0) {
      seasons.push({
        name: 'Extras',
        seasonno,
        idx: i,
        episodes,
        prio: 99999,
      });
    } else {
      seasons.push({
        name: `Season ${seasonno}`,
        seasonno,
        idx: i,
        episodes,
        prio: seasonno,
      });
    }
  }
  seasons.sort((a, b) => a.prio - b.prio);
  currentSeason.value = seasons[0];
}

// onBeforeRouteUpdate((from, to) => {
//   console.log('TvShow: onBeforeRouteUpdate', from, to);
// });

function makeSE(prefix, val) {
  return prefix + val.toString().padStart(2, '0');
}

onBeforeMount(async () => {
  // It may be better to do this in the onBeforeRouteLeave hook.
  // Better to put up a spinner and/or report an error _before_
  // we navigate to the page.
  try {
    await getShow();
  } catch(e) {
    // XXX FIXME.
    console.log('Tvshow::onBeforeMount: error: ', e);
    throw(e);
  }

  // FIXME differentiate between:
  // - season not present in details (redirect to first season)
  // - season not found in seasons (404)
  const [ se, ep ] = route.params.details || [];
  const season = Number((se || '').replace(/^s?0*/, ''));
  const episode = Number((ep || '').replace(/^e?0*/, ''));

  const thisSeason = seasons.find((s) => s.seasonno === season);
  if (!thisSeason) {
    const toSeason = makeSE('s', currentSeason.value.seasonno);
    console.log('TvShow: no season, redirecting to', toSeason);
    router.replace({ name: 'tvshow', params: { details: [ toSeason ] }});
    return;
  }
  currentSeason.value = thisSeason;

  // Watch for changes on currentSeason and update the URL.
  watch(currentSeason, s => {
    router.replace({ name: 'tvshow', params: { details: [ makeSE('s', s.seasonno) ] }});
  });
});

function playEpisode(episode) {

  // Chromecast?
  if (store.state.castState === 'connected') {
    const factory = new PlayerInfoFactory(quasar, store);
    const info = factory.episode(show, currentSeason, episode);
    store.commit('currentVideo', info);
    emitter.emit('playCast');
  }

  // Nope, local player.
  const curRoute = router.currentRoute.value;
  router.push({
    name: 'tvshow-play',
    params: {
      collection: curRoute.params.collection,
      name: curRoute.params.name,
      season: makeSE('s', currentSeason.value.seasonno),
      episode: makeSE('e', episode.episodeno),
    },
  });
}

function scrollToTop() {
  el.value.$el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

function scrollIntoView(ev, epIndex) {
  if (epIndex === 0) {
    scrollToTop();
    return;
  }
  ev.currentTarget.scrollIntoView({
    block: 'nearest',
    behavior: 'smooth',
  });
}
</script>
