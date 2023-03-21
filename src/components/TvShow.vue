<template>
  <lrud no-scroll-into-view ref="el" @xfocusout="doFocus()">
  <div class="tv-show-container q-pt-md">
    <div class="row justify-center">
    <div class="col-12 col-sm-10 tv-show-inner">
    <div class="tv-show-header">
      <Backdrop :poster="poster" :fanart="fanart"/>
      <div class="row text-h3 q-mb-md">
        <div class="col stroke">{{ title }}</div>
      </div>
      <div class="row">
        <div class="col" v-if="seasons && currentSeason">
          <q-item @focusin="scrollToTop" class="col-xs-8 col-sm-auto relative q-pa-none">
            <lrud no-scroll-into-view no-nav-inside steal-keys-outside>
              <q-select
                  filled
                  dense
                  options-dense
                  :options="seasons"
                  :hide-dropdown-icon="seasons.length === 1"
                  option-label="name"
                  :modelValue="currentSeason"
                  @update:modelValue="s => { currentSeason = s; currentEpisode = null }"
                  style="width=100%"
                  options-selected-class="q-select-active-option"
                  data-autofocus="2"
                  v-autofocus="'input'"
                  ref="seasonsEl"
              />
            </lrud>
          </q-item>
        </div>
        <div class="col self-center">
          <q-icon
            v-if="favorite() != null"
            :name="favorite() ? 'favorite' : 'favorite_border'"
            size="28px"
            class="tvshow-favorite q-pa-sm float-right no-outline"
            :color="favorite() ? 'blue' : 'white'"
            @click.stop="toggleFavorite()"
            tabindex="0"
          />
        </div>
        <div class="col-2 col-sm-6"></div>
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
        <lrud :center-x="20">
        <Episode 
          tabindex="-1"
          ref="episodesEl"
          :episode="episode"
          @play="playEpisode(episode)"
          @focusin="scrollIntoView($event, index)"
        />
        </lrud>
      </template>
    </div>
  </div>
  </div>
  </div>
  </lrud>
</template>

<style lang="scss">
@import '~src/css/mixins.scss';
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
.tvshow-favorite {
  opacity: 70%;
  @include stroke();
}
.tvshow-favorite:hover, .tvshow-favorite:focus {
  cursor: crosshair;
  opacity: 100%;
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
  computed,
  inject,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue';
import { useStore } from 'vuex';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useApi } from '../lib/api.js';
import { decodeSE, encodeSE } from '../lib/util.js';
import Backdrop from './Backdrop.vue';
import Episode from './Episode.vue';
import { PlayerInfoFactory } from '../lib/playerinfo.js';

const props = defineProps({
  collection: String,
  name: String,
});

const emitter = inject('emitter');
const api = useApi();
const store = useStore();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();

// console.log('TvShow: script setup, route is', route.path, route.fullPath);

let show;
let fanart;
let poster;
let nameValues;
let title;
let plot;
const seasons = [];

const el = ref(null);
const episodesEl = ref(null);
const seasonsEl = ref(null);
const currentName = route.params.name;
const currentCollection = route.params.collection;
const currentSeason = ref(null);
const currentEpisode = ref(null);

const readyFlag = ref(0);

async function getShow() {

  const item = await api.getShow(props.collection, props.name);
  show = { ...item, collection: currentCollection };

  fanart = show.fanart || '#';
  poster = show.poster || '#';
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
}

onBeforeMount(async () => {
  // Start loading the details for this TvShow.
  //
  // It may be better to do this in the onBeforeRouteLeave hook, or maybe in setup().
  // Better to put up a spinner and/or report an error _before_
  // we navigate to the page.
  try {
    await getShow();
  } catch(e) {
    // XXX FIXME.
    console.log('Tvshow::onBeforeMount: error: ', e);
    throw(e);
  }
  readyFlag.value = 1;
});

onBeforeUnmount(() => {
  saveCurrentSeasonEpisode(true);
});

//
// Save the current season and episode to the store.
// Also debounce it, so that we don't hammer the store.
//
let saveCurrentSeasonEpisodePending;
function saveCurrentSeasonEpisode(onExit) {

  // The actual function that commits the mutation.
  const doSave = () => {
    saveCurrentSeasonEpisodePending = null;
    const tvshow = store.getters.tvshow(currentName);

    // currentSeason.value _should_ always be set, but sometimes
    // isn't while developing with HMR ..
    if (currentSeason.value) {
      const s = currentSeason.value.seasonno;
      const e = currentEpisode.value ? currentEpisode.value.episodeno : null;
      if (s !== tvshow.focusSeason || e !== tvshow.focusEpisode) {
        tvshow.focusSeason = s;
        tvshow.focusEpisode = e;
        store.commit('updateTvShow', { id: currentName, tvshow });
      }
    }
  };

  // When exiting, clear timers and commit immediately.
  if (onExit) {
    if (saveCurrentSeasonEpisodePending) {
      clearTimeout(saveCurrentSeasonEpisodePending);
    }
    doSave();
    return;
  }

  // If there's no pending timer, save now, and start a timer.
  if (!saveCurrentSeasonEpisodePending) {
    doSave();
    saveCurrentSeasonEpisodePending = setTimeout(doSave, 2500);
  }
}

function initCurrentSeasonEpisode() {

  // If this fails it's because someone entered a wrong URL manually.
  const se = decodeSE(route.params.seasonEpisode);
  if (!se) {
    console.log('TvShow: failed to decodeSE', route.params.seasonEpisode);
    router.replace({ name: '404'});
    return false;
  }
  let { season, episode } = se;

  // If we don't have season/episode in the path, check the store
  // and restore the season/episode we last focussed on.
  if (season === null) {
    const tvshow = store.getters.tvshow(currentName);
    if (tvshow.focusSeason != null) {
      season = tvshow.focusSeason;
    }
    if (tvshow.focusEpisode != null) {
      episode = tvshow.focusEpisode;
    }
  }

  // Resolve season.
  if (season !== null) {
    const thisSeason = seasons.find((s) => s.seasonno === season);
    if (!thisSeason) {
      console.log('TvShow: cannot find seasonno', season, 'from', route.params.seasonEpisode);
      router.replace({ name: '404'});
      return false;
    }
    currentSeason.value = thisSeason;
  }

  // Resolve episode.
  if (episode !== null) {
    const thisEpisode = currentSeason.value.episodes.find((e) => e.episodeno === episode);
    if (thisEpisode === null) {
      console.log('TvShow: cannot find episodeno', episode);
      router.replace({ name: '404'});
      return false;
    }
    currentEpisode.value = thisEpisode;
  }

  if (!currentSeason.value) {
    currentSeason.value = seasons[0];
  }
  const e = currentEpisode.value;
  router.replace({
    name: 'tvshow',
    params: {
      name: currentName,
      collection: currentCollection,
      seasonEpisode: encodeSE(currentSeason.value.seasonno, e ? e.episodeno : null),
    },
  });

  // Watch for changes on currentSeason/currentEpisode and update the URL.
  console.log('XXX startr watch');
  watch([currentSeason, currentEpisode], ([s, e]) => {
    console.log('XXX watched changed');
    if (route.name !== 'tvshow') {
      return;
    }
    saveCurrentSeasonEpisode();
    router.replace({
      name: 'tvshow',
      params: {
        name: currentName,
        collection: currentCollection,
        seasonEpisode: encodeSE(s.seasonno, e ? e.episodeno : null),
      },
    });
  });

  return true;
}

function doFocus() {
  if (seasonsEl.value && !currentEpisode.value) {
    seasonsEl.value.focus();
    return;
  }

  if (!currentEpisode.value) {
    currentEpisode.value = currentSeason.value.episodes[0];
  }

  let e = currentEpisode.value.episodeno;
  const elem = el.value.$el.querySelector(`:scope [data-episode="${e}"] [tabindex]`);
  if (elem) {
    elem.focus();
  }
}

onMounted(() => {
  console.log('TvShow: onMounted', route.path, route.name);
  watch(readyFlag, () => {
    console.log('readyflag set!');
    if (initCurrentSeasonEpisode()) {
      setTimeout(() => doFocus(), 0);
    }
  });
  if (readyFlag.value) {
    if (initCurrentSeasonEpisode()) {
      doFocus();
    }
  }
});

function playEpisode(episode) {

  // Chromecast?
  if (store.state.castState === 'connected') {
    const factory = new PlayerInfoFactory(quasar, store);
    const info = factory.episode(show, currentSeason, episode);
    emitter.emit('playCast', info);
  }

  // Nope, local player.
  const curRoute = router.currentRoute.value;
  router.push({
    name: 'tvshow-play',
    params: {
      collection: curRoute.params.collection,
      name: curRoute.params.name,
      seasonEpisode: encodeSE(episode.seasonno, episode.episodeno),
    },
  });
}

function scrollToTop() {
  el.value.$el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

function scrollIntoView(ev, epIndex) {
  const target = ev.currentTarget;
  // console.log('TvShow: XXX: scrollIntoView', target, currentSeason.value.episodes[epIndex]);
  if (epIndex === 0) {
    scrollToTop();
  } else {
    setTimeout(() => target.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    }), 0);
  }
  // console.log('updating currentEpisode.value to', epIndex);
  currentEpisode.value = currentSeason.value.episodes[epIndex];
}

function toggleFavorite() {
  const fav = { id: show.id, name: show.name };
  if (store.getters.isFavorite(fav)) {
    store.commit('removeFavorite', fav);
  } else {
    store.commit('addFavorite', fav);
  }
}

function favorite() {
  return show ? store.getters.isFavorite(show) : null;
}
</script>
