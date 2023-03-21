<template>
<lrud>
<div class="row justify-start">
  <q-item shrink class="col-xs-12 col-sm-5 col-md-3 q-pa-none relative">
    <lrud keys="" center-x=5>
    <q-input
      type="search"
      placeholder="Search titles"
      :clearable="!virtualKeyboard"
      hide-bottom-space
      dense
      dark
      color="white"
      label-color="white"
      style="width: 100%"
      ref="input"
      debounce="500"
      :modelValue="search"
      @update:modelValue="$emit('update:search', $event)"
      @click="onClick"
      @focusout="onFocusOut"
      @keydown="onKeyDown"
    >
      <template v-slot:append>
          <q-icon name="search" />
      </template>
    </q-input>
    </lrud>
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
    bg-color="blue-grey-10"
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
    bg-color="blue-grey-10"
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
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

export default {
  props: {
    type: String,
    genres: Array,
    search: String,
    sortBy: String,
    genreFilter: Array,
  },

  setup(props, context) {
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
    const input = ref(null);
    const isTv = quasar.platform.is.tv;
    let inputElem = null;
    let readOnly = false;

    onMounted(() => {
      inputElem = input.value.$el.querySelector(':scope INPUT');
      inputElem.setAttribute('autocapitalize', 'off');
      inputElem.setAttribute('autocomplete', 'off');
      if (isTv) {
        inputElem.setAttribute('readonly', 'true');
        readOnly = true;
      }
    });

    function onClick() {
      console.log('click!');
      if (isTv) {
        if (readOnly) {
          inputElem.removeAttribute('readonly');
          inputElem.focus();
        } else {
          // Need this, otherwise there is a race condition where
          // the new value is not $emit'ted.
          setTimeout(() => {
            inputElem.setAttribute('readonly', 'true');
          }, 0);
        }
        readOnly = !readOnly;
      }
    }

    function onFocusOut() {
      if (isTv) {
        inputElem.setAttribute('readonly', 'true');
        readOnly = true;
      }
    }

    function onKeyDown(ev) {
      if (!readOnly) {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
          ev.stopPropagation();
        }
      }
    }

    return {
      input,
      onClick,
      onFocusOut,
      onKeyDown,
      sortByOptions,
      virtualKeyboard,
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
