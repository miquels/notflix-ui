<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-grey-10 text-white">
      <q-toolbar>
        <!-- q-btn dense flat round icon="menu" @click="toggleLeftDrawer" /-->
        <q-toolbar-title class="col-auto q-ml-lg">
          <span class="reverse-n">&#7438;</span>otflix
        </q-toolbar-title>
        <q-tabs shrink class="col">
          <q-route-tab name="tv-shows" label="TV Shows" to="/tv-shows/" />
          <q-route-tab name="movies" label="Movies" to="/movies/" />
      </q-tabs>
      <div class="col"/>
      <q-item shrink id="filter" class="col-auto q-pa-none" />
      <CastButton class="cursor-pointer" />
      </q-toolbar>
    </q-header>

    <q-drawer
      behavior="desktop"
      class="drawer pretty-scrollbar"
      :width="200"
      v-model="leftDrawerOpen"
      side="left"
      overlay
      elevated
    >
      <Filter />
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="keepAlive">
          <component :is="Component" :key="$route.fullPath"/>
        </keep-alive>
      </router-view>
    </q-page-container>

    <q-footer :modelValue="castActive()" elevated class="bg-grey-10 text-white cursor-pointer">
      <Chromecast/>
      <Play />
    </q-footer>

  </q-layout>
</template>

<style lang="scss">
@import '~src/css/app.scss';
.reverse-n {
  color: #007bfd;
  font-size: 32px;
  line-height: 20px;
}
.sort {
  color: white;
}
.drawer {
  height: calc(100vh - 50px);
}
</style>

<script>
import { ref, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import Chromecast from 'components/Chromecast.vue';
import CastButton from 'components/CastButton.vue';
import Play from 'components/Play.vue';
import Filter from 'components/Filter.vue';
import { isMobile } from '../lib/util.js';

export default {
  components: {
    Chromecast,
    CastButton,
    Filter,
    Play,
  },
  setup() {
    const store = useStore();
    const leftDrawerOpen = ref(false);
    const showSearch = ref(false);
    const mobile = isMobile();
    const quasar = useQuasar();

    // XXX DEBUG
    window.store = store;

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
      'VirtualScroll',
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
