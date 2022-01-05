<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-grey-10 text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="col-auto">
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Notflix
        </q-toolbar-title>
        <q-tabs shrink class="col">
          <q-route-tab name="tv-shows" label="TV Shows" to="/tv-shows/" />
          <q-route-tab name="movies" label="Movies" to="/movies/" />
      </q-tabs>
      <div class="col"/>
      <q-icon name="cast" size="24px" @click="toggleCast" />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above behavior="mobile" v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="['PageTvShows', 'PageMovies', 'TvShows', 'Movies', 'Thumbs']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>

    <q-footer :modelValue="castOn" elevated class="bg-grey-10 text-white">
      <Chromecast/>
    </q-footer>

  </q-layout>
</template>

<script>
import { ref } from 'vue';
import Chromecast from 'components/Chromecast.vue';

export default {
  components: {
    Chromecast,
  },
  setup() {
    const leftDrawerOpen = ref(false);
    const castOn = ref(false);

    return {
      leftDrawerOpen,
      castOn,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      toggleCast() {
        castOn.value = !castOn.value;
      },
    };
  },
};
</script>
