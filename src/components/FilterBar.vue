<template>
<div class="row justify-start">
  <q-item shrink class="col-xs-12 col-sm-5 col-md-3 q-pa-none relative">
    <q-input
      :modelValue="search"
      @update:modelValue="$emit('update:search', $event)"
      placeholder="Search titles"
      dark
      clearable
      hide-bottom-space
      dense
      debounce="500"
      label-color="white"
      type="search"
      color="white"
      style="width: 100%"
    />
    <q-btn
      dense
      flat
      icon="search"
      color="white"
      tabindex="-1"
    />
  </q-item>
  <q-item class="col-sm col-xs-auto q-pa-none" />
  <q-item class="col-xs-4 col-sm-auto q-pa-none relative">
  <q-select
    filled
    dense
    options-dense
    :options="sortByOptions"
    :modelValue="sortBy"
    @update:modelValue="$emit('update:sortBy', $event)"
    label="Sort by"
    style="width: 100%"
    class="inline"
    options-selected-class="q-select-active-option"
  />
  </q-item>
  <div class="col-auto" />
  <q-item class="col-xs-8 col-sm-auto relative q-pa-none">
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
    style="width: 100%"
    class="q-pl-md"
    options-selected-class="q-select-active-option"
  />
  </q-item>
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
// Override max height of a QSelect in dialog mode, because the
// only way to close it is to click outside of it, and it
// almost covers the entire screen...
body.mobile:not(.native-mobile) .q-select__dialog {
  max-height: 70vh !important;
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
