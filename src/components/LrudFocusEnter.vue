<template>
  <q-item ref="el" tabindex="0">
    <slot></slot>
  </q-item>
</template>

<script>
import {
  onMounted,
  onBeforeUnmount,
  ref,
} from 'vue';

export default {
  name: 'LrudFocusEnter',
  setup () {
    const el = ref();
    let input;
    let handler;

    onMounted(() => {

      // Find the input element.
      input = el.value.$el.querySelector(':scope input');
      if (!input) {
        return;
      }
      input.setAttribute('tabindex', '-1');

      // Handle keyboard events.
      handler = (ev) => {
        if (ev.key === 'Enter') {
          if (document.activeElement === el.value.$el) {
            input.focus();
          } else if (document.activeElement === input) {
            el.value.$el.focus();
          }
        }
      }
      el.value.$el.addEventListener('keydown', handler);
    });

    onBeforeUnmount(() => {
      if (handler) {
        el.value.$el.removeEventListener('keydown', handler);
      }
    });

    return { el };
  }
}
</script>
