<template>
  <lrud no-scroll-into-view ref="el" @xfocusout="doFocus()">
  <div class="tv-show-container q-pt-md">
    <div class="row justify-center">
      <div class="col-12 col-sm-10 tv-show-inner">

        <div class="tv-show-header column q-mx-sm">
          <Backdrop :poster="poster" :fanart="fanart"/>

          <div class="col">
            <div class="row text-h3 q-mb-md">
              <div class="col stroke">{{ title }}</div>
            </div>
          </div>

          <div class="col">
            <div class="row q-my-md">
              <div class="col tvshow-plot">{{ plot }}
              </div>
              <div class="col-2 col-sm-6"></div>
            </div>
          </div>

          <div class="col">
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

          <div class="col" @focusin="{ scrollToTop(); currentEpisode = null }">
            <div class="row items-start" v-if="seasons && currentSeason">
              <div
                class="col-xs-10 col-sm-auto relative q-pa-none q-pr-md"
                style="height: 48px;"
                v-if="resumeEpisode"
              >
                <q-btn
                  no-caps
                  no-wrap
                  style="height: 40px; width: 100%"
                  color="blue-grey-10"
                  tabindex="0"
                  @click="playEpisode(resumeEpisode)"
                  v-autofocus
                  data-autofocus="2"
                  ref="resumeEpisodeEl"
                >
                  Resume {{ seasonEpisode(resumeEpisode) }}
                </q-btn>
              </div>
              <div
                class="col-xs-10 col-sm-auto relative q-pa-none q-pr-md"
                style="height: 48px;"
                v-if="nextEpisode"
              >
                <q-btn
                  no-caps
                  no-wrap
                  style="height: 40px; width: 100%"
                  color="blue-grey-10"
                  tabindex="0"
                  @click="playEpisode(nextEpisode)"
                  v-autofocus
                  data-autofocus="2"
                  ref="nextEpisodeEl"
                >
                  Play {{ seasonEpisode(nextEpisode) }}
                </q-btn>
              </div>
              <q-item
                class="col-xs-10 col-sm-auto relative q-pa-none q-pr-md"
              >
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
                      style="width: 100%"
                      bg-color="blue-grey-10"
                      options-selected-class="q-select-active-option"
                      data-autofocus="2"
                      v-autofocus="{ vIf: !resumeEpisode && !nextEpisode, selector: 'input' }"
                      ref="seasonsEl"
                      no-wrap
                  />
                </lrud>
              </q-item>
              <div class="col relative q-pa-none">
                <q-btn
                  :icon="isFavorite() ? 'favorite' : 'favorite_border'"
                  round
                  icon-size="28px"
                  class="tvshow-favorite q-pa-sm float-right no-outline"
                  color="blue-grey-10"
                  :text-color="isFavorite() ? 'blue' : 'white'"
                  @click.stop="toggleFavorite()"
                  tabindex="0"
                />
              </div>
              <div class="col-12 col-sm-6"></div>
            </div>
          </div>
        </div>

        <lrud>
        <div v-if="seasons && currentSeason" class="tv-show-episodes">
          <template v-for="(episode, index) in currentSeason.episodes" :key="episode.name">
            <lrud :center-x="5">
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
        </lrud>

      </div>
    </div>
  </div>
  </lrud>
</template>

<style lang="scss">
@import '~src/css/mixins.scss';
.tv-show-container {
  position: relative;
  font-family: 'Roboto', sans-serif;
  // font-weight: 700;
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
import { decodeSE, encodeSE, whenTrue } from '../lib/util.js';
import Backdrop from './Backdrop.vue';
import Episode from './Episode.vue';
// import WhatNext from './WhatNext.vue';
import { PlayerInfoFactory } from '../lib/playerinfo.js';

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
const resumeEpisodeEl = ref(null);
const nextEpisodeEl = ref(null);
const currentShowId = route.params.id;
const currentCollection = route.params.collection;

// Currently selected season, and episode that has the focus.
const currentSeason = ref(null);
const currentEpisode = ref(null);

// Episode to be resumed, and next episode to play (if any).
const resumeEpisode = ref(null);
const nextEpisode = ref(null);

const { fromRoute } = defineProps({ fromRoute: Object });
const readyFlag = ref(0);

async function getShow() {

  const item = await api.getShow(currentCollection, currentShowId);
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
    const { seasonno, episodes } = show.seasons[i];
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
    console.log('TvShow: onBeforeMount: getShow()');
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
    const tvshow = store.getters.tvshow(currentShowId);

    // currentSeason.value _should_ always be set, but sometimes
    // isn't while developing with HMR ..
    if (currentSeason.value) {
      const s = currentSeason.value.seasonno;
      const e = currentEpisode.value ? currentEpisode.value.episodeno : null;
      if (s !== tvshow.focusSeason || e !== tvshow.focusEpisode) {
        store.commit('updateTvShowFocus', {
          id: currentShowId,
          focusSeason: s,
          focusEpisode: e,
        });
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

// Find the last episode that was watched.
// If no episodes were watched yet, return the very first episode.
function getLastEpisode() {
  for (let sidx = seasons.length - 1; sidx >= 0; sidx -= 1) {
    const season = seasons[sidx];
    for (let eidx = season.episodes.length - 1; eidx >= 0; eidx -= 1) {
      const episode = season.episodes[eidx];
      if (episode.seen && episode.seen.currentTime > 0) {
        return [season, episode];
      }
    }
  }
  const season = seasons[0];
  return [ season, season.episodes[0] ];
}

// Find the next episode.
function getNextEpisode(startSeason, startEpisode) {
  let startEpisodeNo = startEpisode.episodeno;
  for (let season of seasons) {
    if (season.seasonno < startSeason.seasonno) {
      continue;
    }
    for (let episode of season.episodes) {
      if (startEpisodeNo != null) {
        if (episode.episodeno === startEpisodeNo) {
          startEpisodeNo = null;
        }
        continue;
      }
      return [ season, episode ];
    }
    startEpisodeNo = null;
  }
  return null;
}

// Helper for the template.
function seasonEpisode(episode) {
  if (episode.episodeno > 18000000) {
    const e = episode.episodeno;
    const y = Math.floor(e / 10000);
    const m = (Math.floor(e / 100) % 100).toString().padStart(2, '0');
    const d = (e % 100).toString().padStart(2, '0');
    return `${y}.${m}.${d}`;
  }
  const se = episode.seasonno.toString().padStart(2, '0');
  const ep = episode.episodeno.toString().padStart(2, '0');
  return `S${se} E${ep}`;
}

function setCurrentSeasonEpisode(season, episode) {
  // Resolve season.
  if (season != null) {
    const thisSeason = seasons.find((s) => s.seasonno === season);
    if (!thisSeason) {
      console.log('TvShow: cannot find seasonno', season, 'from', route.params.seasonEpisode);
      router.replace({ name: '404'});
      return false;
    }
    currentSeason.value = thisSeason;
  } else {
    currentSeason.value = seasons[0];
  }

  // Resolve episode.
  if (episode != null) {
    const thisEpisode = currentSeason.value.episodes.find((e) => e.episodeno === episode);
    if (thisEpisode === null) {
      console.log('TvShow: cannot find episodeno', episode);
      router.replace({ name: '404'});
      return false;
    }
    currentEpisode.value = thisEpisode;
  }
  return true;
}

// Make a guess if we:
//
// 1. have to play from the start
// 2. have to resume the episode
// 3. can play the next episode.
//
// 2 and 3 can both be true.
//
function episodeState(episode) {
  if (!episode || !episode.seen) {
    return { play: episode != null, resume: false, next: false };
  }
  const seen = episode.seen;
  const progress = seen.currentTime / seen.duration;
  const secsLeft = seen.duration - seen.currentTime;
  const play = seen.currentTime < 5;
  const resume = seen.currentTime >= 5 && (progress < 0.95 || secsLeft >= 60);
  const next = progress >= 0.80 || secsLeft < 300;
  return { play, resume, next };
}

function backFromPlay() {
  const se = decodeSE(route.params.seasonEpisode);
  if (!se) {
    return false;
  }
  return fromRoute &&
    fromRoute.path.startsWith(route.path) &&
    fromRoute.path.endsWith('/play') &&
    se.season &&
    se.episode;
}

// Initialize:
//
// - currentSeason
// - currentEpisode
// - resumeEpisde
// - nextEpisode
//
function initCurrentSeasonEpisode() {

  // If this fails it's because someone entered a wrong URL manually.
  const se = decodeSE(route.params.seasonEpisode);
  if (!se) {
    console.log('TvShow: failed to decodeSE', route.params.seasonEpisode);
    router.replace({ name: '404'});
    return false;
  }

  // Set currentSeason and episode from the path parameters.
  if (!setCurrentSeasonEpisode(se.season, se.episode)) {
    return false;
  }
  let episode = currentEpisode.value;

  // If we came back from 'play' and we have a season/episode in the
  // path, then we want to focus on the episode to resume, or the next one.
  const isBackFromPlay = backFromPlay();

  // If we're not focussing on a specific episode, find last episode played.
  if (!isBackFromPlay) {
    const last = getLastEpisode();
    if (!last) {
      return true;
    }
    const [ s, e ] = last;
    currentSeason.value = s;
    episode = e;
  }

  const state = episodeState(episode);
  console.log('EPISODE STATE', state);
  if (state.play) {
    nextEpisode.value = episode;
  }

  if (state.resume) {
    resumeEpisode.value = episode;
  }

  if (state.next) {
    const next = getNextEpisode(currentSeason.value, episode);
    if (next) {
      const [ se, ep ] = next;
      if (episodeState(ep).play) {
        console.log('NEXT EPISODE', ep, 'backfromplay', isBackFromPlay, 'state.resume', state.resume);
        currentSeason.value = se;
        if (isBackFromPlay && !state.resume) {
          currentEpisode.value = ep;
        }
        nextEpisode.value = ep;
      }
    }
  }

  // Update the path parameters.
  const e = currentEpisode.value;
  router.replace({
    name: 'tvshow',
    params: {
      id: currentShowId,
      collection: currentCollection,
      seasonEpisode: encodeSE(currentSeason.value.seasonno, e ? e.episodeno : null),
    },
  });

  // Watch for changes on currentSeason/currentEpisode and update the URL.
  watch([currentSeason, currentEpisode], ([s, e]) => {
    if (route.name !== 'tvshow') {
      return;
    }
    saveCurrentSeasonEpisode();
    router.replace({
      name: 'tvshow',
      params: {
        id: currentShowId,
        collection: currentCollection,
        seasonEpisode: encodeSE(s.seasonno, e ? e.episodeno : null),
      },
    });
  });

  return true;
}

function doFocus() {
  if (!currentEpisode.value) {
    if (nextEpisodeEl.value) {
      nextEpisodeEl.value.$el.focus();
      return;
    }
    if (resumeEpisodeEl.value) {
      resumeEpisodeEl.value.$el.focus();
      return;
    }
    if (seasonsEl.value) {
      seasonsEl.value.focus();
      return;
    }
    currentEpisode.value = currentSeason.value.episodes[0];
  }

  let e = currentEpisode.value.episodeno;
  const elem = el.value.$el.querySelector(`:scope [data-episode="${e}"] [tabindex]`);
  if (elem) {
    elem.focus();
  }
}

onMounted(() => {
  console.log('TvShow: onMounted', route.path, route.id);
  whenTrue(readyFlag, () => {
    // console.log('TvShow: onMounted, initCurrentSeasonEpisode');
    if (initCurrentSeasonEpisode()) {
      // console.log('TvShow: onMounted, done, calling doFocus');
      setTimeout(() => doFocus(), 0);
    }
  });
});

function playEpisode(episode) {

  // Chromecast?
  if (store.state.castState === 'connected') {
    const factory = new PlayerInfoFactory(quasar, store);
    const info = factory.episode(show, currentSeason.value, episode);
    emitter.emit('playCast', info);
    return;
  }

  // Nope, local player.
  const curRoute = router.currentRoute.value;
  const to = {
    name: 'tvshow-play',
    params: {
      collection: curRoute.params.collection,
      id: curRoute.params.id,
      seasonEpisode: encodeSE(episode.seasonno, episode.episodeno),
    },
  };
  if (episode.seen) {
    to.query = { t: episode.seen.currentTime };
  }
  router.push(to);
}

function scrollToTop() {
  el.value.$el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

function scrollIntoView(ev, epIndex) {
  const target = ev.currentTarget;
  // console.log('TvShow: XXX: scrollIntoView', target, currentSeason.value.episodes[epIndex]);
  setTimeout(() => target.scrollIntoView({
    block: 'nearest',
    behavior: 'smooth',
  }), 0);
  // console.log('updating currentEpisode.value to', epIndex);
  currentEpisode.value = currentSeason.value.episodes[epIndex];
}

function toggleFavorite() {
  let isFav = api.isFavorite(show.id);
  api.setFavorite(show.id, !isFav);
}

function isFavorite() {
  return show && api.isFavorite(show.id);
}
</script>
