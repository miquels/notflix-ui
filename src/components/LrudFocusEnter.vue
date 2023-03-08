<template>
  <div ref="el" tabindex="0">
    <slot></slot>
  </div>
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
      input = el.value.querySelector(':scope input');
      if (!input) {
        return;
      }
      input.setAttribute('tabindex', '-1');

      // Handle keyboard events.
      handler = (ev) => {
        if (ev.key === 'Enter') {
          if (document.activeElement === el.value) {
            input.focus();
          } else if (document.activeElement === input) {
            el.value.focus();
          }
        }
      }
      el.value.addEventListener('keydown', handler);
    });

    onBeforeUnmount(() => {
      if (handler) {
        el.value.removeEventListener('keydown', handler);
      }
    });

    return { el };
  }
}
</script>
