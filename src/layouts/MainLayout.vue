<template>
<lrud>
  <q-layout view="hHh lpR fFf" v-autofocus>

    <q-header
      elevated
      class="bg-grey-10 text-white opacity-transition"
      @focusin="headerFocus(true)"
      @focusout="headerFocus(false)"
      :style="showHeader()"
    >
      <lrud>
      <q-toolbar>
        <lrud no-nav-inside steal-keys-outside keys="LR">
        <q-tabs shrink class="col" v-focus="{ prio: 3, selector: '.q-tab--active' }">
          <q-route-tab name="home" to="/home/">
            <q-toolbar-title class="col-auto q-pa-none q-ma-none">
              <span class="reverse-n">&#7438;</span>otflix
            </q-toolbar-title>
          </q-route-tab>
          <q-route-tab
            name="tv-shows"
            label="TV Shows"
            to="/tv-shows/"
            @click="routeTab($event, '/tv-shows/')"
          />
          <q-route-tab
            name="movies"
            label="Movies"
            to="/movies/"
            @click="routeTab($event, '/movies/')"
          />
        </q-tabs>
        </lrud>
        <div v-if="devel()" class="col text-center main-devel">DEVEL</div>
        <div v-if="!devel()" class="col" />
        <CastButton v-if="canCast()" class="on-right cursor-pointer" />
        <q-btn
          v-if="hasSettings()"
          square dense
          class="on-right"
          @click="$router.push('/settings/');"
        >
          <q-icon
            name="settings"
            size="24px"
          />
        </q-btn>
        <q-btn square dense class="on-right" @click="refresh()">
          <q-icon
            name="refresh"
            size="24px"
          />
        </q-btn>
      </q-toolbar>
      </lrud>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="keepAlive">
          <component
            :is="Component"
            :key="$route.name"
          />
        </keep-alive>
      </router-view>
      <q-linear-progress
        color="blue-5"
        dark
        indeterminate
        class="main-progress"
        v-if="progress"
      />
    </q-page-container>

    <q-footer
      :modelValue="store.state.castActive"
      elevated
      class="bg-grey-10 text-white cursor-pointer"
    >
      <Chromecast v-if="canCast()" />
    </q-footer>

  </q-layout>
</lrud>
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
.opacity-transition {
  transition: opacity .8s ease-out;
}
.main-progress {
  left: 0;
  bottom: 0;
  position: fixed;
  z-index: 100;
}
.main-devel {
  font-weight: 700;
  color: red;
}
</style>

<script>
import { ref, inject, onMounted, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { canCast } from 'components/Chromecast.vue';
import Chromecast from 'components/Chromecast.vue';
import { hasSettings } from 'pages/Settings.vue';
import CastButton from 'components/CastButton.vue';
import { isMobile, addPrettyScrollBars } from '../lib/util.js';

export default {
  components: {
    Chromecast,
    CastButton,
  },
  setup() {
    const store = useStore();
    const mobile = isMobile();
    const quasar = useQuasar();
    const route = useRoute();
    const emitter = inject('emitter');
    const progress = ref(false);

    // XXX DEBUG
    window.store = store;
    window.quasar = quasar;

    onBeforeMount(() => {
      if (!mobile && !quasar.platform.is.safari) {
        addPrettyScrollBars();
      }
    });

    emitter.on('progress', (val) => {
      console.log('MainLayout: setting progress value to', val);
      progress.value = val;
    });

    const keepAlive = [
      'PageTvShows',
      'PageMovies',
      'PageHome',
    ];

    const headerHasFocus = ref(true);

    return {
      canCast,
      keepAlive,
      emitter,
      store,
      headerHasFocus,
      hasSettings,
      progress,
    };
  },

  methods: {
    devel() {
      return process.env.DEV;
    },

    showHeader() {
      if (!this.$q.platform.is.tv)
        return {};
      const path = this.$route.path.endsWith('/') ? this.$route.path : this.$route.path + '/';
      switch (path) {
        case '/':
        case '/home/':
        case '/movies/':
        case '/tv-shows/':
        case '/settings/':
          return {};
      }
      return { opacity: this.headerHasFocus ? '1' : '0' };
    },

    headerFocus(focus) {
      this.headerHasFocus = focus;
    },

    refresh() {
      const url = new URL(window.location.origin);
      url.searchParams.set('reloadTime', Date.now().toString());
      window.location.href = url.toString();
    },

    // If the user clicks on 'TV Shows' or 'Movies' and that is already
    // the current route, emit a 'scrollToTop' event.
    routeTab(ev, to) {
      // console.log('to', to, 'path', this.$route.path);
      if (to === this.$route.path || to === this.$route.path + '/') {
        this.emitter.emit('scrollToTop');
        ev.stopPropagation();
      }
    },
  },
};
</script>
