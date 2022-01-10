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
            :hidden="!showSearch"
            :modelValue="store.state.search"
            @update:modelValue="store.commit('search', $event)"
            dark
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
            @click="showSearch = !showSearch"
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
        <keep-alive :include="['PageTvShows', 'PageMovies', 'TvShows', 'Movies', 'Thumbs']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>

    <q-footer :modelValue="castActive()" elevated class="bg-grey-10 text-white">
      <Chromecast/>
    </q-footer>

  </q-layout>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import Chromecast from 'components/Chromecast.vue';
import CastButton from 'components/CastButton.vue';

export default {
  components: {
    Chromecast,
    CastButton,
  },
  setup() {
    const leftDrawerOpen = ref(false);
    const store = useStore();

    return {
      leftDrawerOpen,
      store,
      showSearch: ref(false),
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
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
