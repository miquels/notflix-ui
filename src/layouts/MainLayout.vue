<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-grey-10 text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="col-auto">
          Notflix
        </q-toolbar-title>
        <q-item v-show="store.state.showSearch" shrink class="col-auto q-pa-none">
          <q-input
            v-if="showSearch"
            :modelValue="store.state.search"
            @update:modelValue="store.commit('search', $event)"
            dark
            autofocus
            clearable
            hide-bottom-space
            dense
            debounce="500"
            label-color="white"
            type="search"
            color="white"
          />
          <q-btn
            dense
            flat
            icon="search"
            color="white"
            @click="toggleSearch"
          />
        </q-item>
        <q-tabs shrink class="col">
          <q-route-tab name="tv-shows" label="TV Shows" to="/tv-shows/" />
          <q-route-tab name="movies" label="Movies" to="/movies/" />
      </q-tabs>
      <div class="col"/>
      <CastButton />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above behavior="mobile" v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="keepAlive">
          <component :is="Component" :key="$route.fullPath"/>
        </keep-alive>
      </router-view>
    </q-page-container>

    <q-footer :modelValue="castActive()" elevated class="bg-grey-10 text-white">
      <Chromecast/>
      <Play />
    </q-footer>

  </q-layout>
</template>

<style lang="scss">
@import '~src/css/app.scss';
</style>

<script>
import { ref, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import Chromecast from 'components/Chromecast.vue';
import CastButton from 'components/CastButton.vue';
import Play from 'components/Play.vue';
import { isMobile } from '../lib/util.js';

export default {
  components: {
    Chromecast,
    CastButton,
    Play,
  },
  setup() {
    const store = useStore();
    const leftDrawerOpen = ref(false);
    const showSearch = ref(false);
    const mobile = isMobile();
    const quasar = useQuasar();

    onBeforeMount(() => {
      if (!mobile && !quasar.platform.is.safari) {
        const body = document.getElementsByTagName('BODY');
        body[0].classList.add('pretty-scrollbar');
      }
    });

    const keepAlive = [
      'PageTvShows',
      'PageMovies',
      'TvShows',
      'Movies',
      // 'PageTvShow',
      // 'PageMovie',
      // 'TvShow',
      // 'Movie',
      'Thumbs',
    ];

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      showSearch,
      toggleSearch() {
        showSearch.value = !showSearch.value;
      },
      keepAlive,
      store,
    };
  },
  methods: {
    castActive() {
      console.log('mainLayout: castActive:', this.store.state.castActive);
      return this.store.state.castActive;
    },
  },
};
</script>
