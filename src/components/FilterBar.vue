<template>
<lrud>
<div class="row justify-start">
  <q-item shrink class="col-xs-12 col-sm-5 col-md-3 q-pa-none relative">
    <lrud-focus-enter>
    <q-input
      :modelValue="search"
      autocapitalize="off"
      autocomplete="off"
      @update:modelValue="$emit('update:search', $event)"
      @keydown.enter="search_enter()"
      placeholder="Search titles"
      dark
      :clearable="!virtualKeyboard"
      hide-bottom-space
      dense
      debounce="500"
      label-color="white"
      type="search"
      color="white"
      style="width: 100%"
      ref="input"
    >
      <template v-slot:append>
          <q-icon name="search" />
      </template>
    </q-input>
    </lrud-focus-enter>
  </q-item>
  <q-item class="col-sm col-xs-auto q-pa-none" />
  <q-item class="col-xs-4 col-sm-auto q-pa-none relative">
  <lrud no-nav-inside steal-keys-outside>
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
  </lrud>
  </q-item>
  <div class="col-auto" />
  <q-item class="col-xs-8 col-sm-auto relative q-pa-none">
  <lrud no-nav-inside steal-keys-outside>
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
  </lrud>
  </q-item>
</div>
</lrud>
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
    let sortByOptions = [
      'Added',
      'Rating',
      'Title',
      'Year',
    ];
    if (!props.type || props.type === 'series') {
      sortByOptions = ['Updated', ...sortByOptions];
    }

    const virtualKeyboard = 'virtualKeyboard' in navigator;

    return {
      sortByOptions,
      virtualKeyboard,
    };
  },

  methods: {
    genreDisplayValue() {
      const val = this.genreFilter && this.genreFilter.length ? this.genreFilter.join(' ') : 'All';
      return `<span class="filterbar-genre-display">${val}</span>`;
    },

    search_enter() {
      console.log('enter');
      // this.$refs.input.blur();
    },
  },
};
</script>
