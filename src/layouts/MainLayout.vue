<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-grey-10 text-white">
      <q-toolbar>
        <q-tabs shrink class="col">
          <q-route-tab name="home" to="/" >
            <q-toolbar-title class="col-auto q-pa-none q-ma-none">
              <span class="reverse-n">&#7438;</span>otflix
            </q-toolbar-title>
          </q-route-tab>
          <q-route-tab
            name="tv-shows"
            label="TV Shows"
            to="/tv-shows/"
            @click="routeTab('/tv-shows/')"
          />
          <q-route-tab
            name="movies"
            label="Movies"
            to="/movies/"
            @click="routeTab('/movies/')"
          />
      </q-tabs>
      <div class="col"/>
      <CastButton class="on-right cursor-pointer" />
      <q-icon
        name="settings"
        class="on-right hover-pointer"
        size="24px"
        @click="$router.push('/settings/');"
      />
      </q-toolbar>
    </q-header>

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
.q-tab {
  padding-left: 8px;
  padding-right: 8px;
}
</style>

<script>
import { ref, inject, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import Chromecast from 'components/Chromecast.vue';
import CastButton from 'components/CastButton.vue';
import Play from 'components/Play.vue';
import { isMobile, addPrettyScrollBars } from '../lib/util.js';

export default {
  components: {
    Chromecast,
    CastButton,
    Play,
  },
  setup() {
    const store = useStore();
    const mobile = isMobile();
    const quasar = useQuasar();
    const emitter = inject('emitter');

    // XXX DEBUG
    window.store = store;

    onBeforeMount(() => {
      if (!mobile && !quasar.platform.is.safari) {
        addPrettyScrollBars();
      }
    });

    const keepAlive = [
      'PageTvShows',
      'PageMovies',
      'PageHome',
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
      keepAlive,
      emitter,
      store,
    };
  },
  methods: {
    castActive() {
      console.log('mainLayout: castActive:', this.store.state.castActive);
      return this.store.state.castActive;
    },

    // If the user clicks on 'TV Shows' or 'Movies' and that is already
    // the current route, emit a 'scrollToTop' event.
    routeTab(to) {
      if (to === this.$route.fullPath) {
        this.emitter.emit('scrollToTop');
      }
    },
  },
};
</script>
