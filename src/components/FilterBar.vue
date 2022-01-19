<template>
<div class="row justify-start">
  <q-item shrink class="col-auto q-pa-none">
    <q-input
      :modelValue="search"
      @update:modelValue="$emit('update:search', $event)"
      placeholder="Search titles"
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
    />
  </q-item>
  <q-item class="col" />
  <q-select
    filled
    dense
    options-dense
    :options="sortByOptions"
    :modelValue="sortBy"
    @update:modelValue="$emit('update:sortBy', $event)"
    label="Sort by"
    style="width: 100px"
    class="col-auto inline"
  />
  <q-select
    filled
    dense
    options-dense
    multiple
    :options="genres"
    :modelValue="genreFilter"
    :displayValue="genreDisplayValue()"
    display-value-html
    @update:modelValue="$emit('update:genreFilter', $event)"
    label="Genre"
    clearable
    style="width: 250px"
    class="col-auto q-pl-md inline relative"
  />
</div>
</template>

<style lang="scss">
.filterbar-genre-display {
  display: inline-block;
  width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
export default {
  props: {
    type: String,
    genres: Array,
    search: String,
    sortBy: String,
    genreFilter: Array,
  },

  setup(props) {
    // const sortByKey = ref(null);
    let sortByOptions = [
      'Added',
      'Rating',
      'Title',
      'Year',
    ];
    if (!props.type || props.type === 'series') {
      sortByOptions = ['Updated', ...sortByOptions];
    }

    return {
      sortByOptions,
    };
  },

  methods: {
    genreDisplayValue() {
      const val = this.genreFilter && this.genreFilter.length ? this.genreFilter.join(' ') : 'All';
      return `<span class="filterbar-genre-display">${val}</span>`;
    },
  },
};
</script>
