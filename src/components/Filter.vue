<template>
  <q-item dense class="sort sort-header q-pt-md">SORT BY</q-item>
  <q-list dense class="q-pl-md">
    <q-item
      v-for="sort in sortBy" :key="sort.key"
      clickable
      dense
      :active="isSortBySelected(sort)"
      @click="sortByClicked(sort)"
      class="sort sort-inactive q-pl-none"
      active-class="sort-active"
    >
    {{ sort.name }}
    </q-item>
  </q-list>

  <q-item />

  <q-item dense class="sort sort-header q-pt-md">GENRE</q-item>
  <q-list dense class="q-pl-md">
    <q-item
      v-for="genre in genres" :key="genre"
      clickable
      dense
      :active="isGenreSelected(genre)"
      @click="genreClicked(genre)"
      class="sort sort-inactive q-pl-none"
      active-class="sort-active"
    >
    {{ genre }}
    </q-item>
  </q-list>
  <q-item />

</template>

<style lang="scss">
.sort {
  color: white;
}
.sort-header {
  font-size: 14px;
  line-height: 32px;
  font-weight: 500;
}
.sort-inactive {
  border-width: 0 0 0 2px;
  border-color: transparent;
  border-style: solid;
  padding-left: 5px;
  font-size: 12px;
  line-height: 28px;
  font-weight: 500;
}
.sort-active {
  border-color: white;
}
</style>

<script>
import {
  computed,
  markRaw,
  ref,
} from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();

    const sortByKey = ref(null);
    const sortBy = computed(() => {
      let options = [
        { key: 'added', name: 'ADDED' },
        { key: 'rating', name: 'RATING' },
        { key: 'title', name: 'TITLE' },
        { key: 'year', name: 'YEAR' },
      ];
      if (store.state.currentView.type === 'series') {
        options = [{ key: 'updated', name: 'UPDATED' }, ...options];
      }
      options[0].default = true;
      return options;
    });

    const genres = computed(() => store.getters.genres);
    const genresSelected = ref([]);

    return {
      store,
      sortBy,
      sortByKey,
      genres,
      genresSelected,
    };
  },

  methods: {
    isSortBySelected(item) {
      if (!this.sortBy.find((s) => s.key === this.sortByKey)) {
        this.sortByKey = this.sortBy.find((s) => s.default).key;
      }
      // console.log('isSortBySelected', this.sortByKey, item);
      // console.log('genres:', this.genres);
      // console.log('genres:', this.store.state.currentView.genres);
      return item.key === this.sortByKey;
    },

    sortByClicked(item) {
      // console.log('sortByClicked', item.key);
      this.sortByKey = item.key;
      this.store.commit('sortBy', item.key);
    },

    isGenreSelected(genre) {
      return this.genresSelected.includes(genre);
    },

    genreClicked(genre) {
      if (!this.genresSelected.includes(genre)) {
        this.genresSelected.push(genre);
      } else {
        this.genresSelected = this.genresSelected.filter((g) => g !== genre);
      }
      this.store.commit('filterGenres', markRaw(this.genresSelected));
    },
  },
};
</script>
