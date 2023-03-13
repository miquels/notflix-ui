<template>
  <q-list @keydown="onKeyDown" ref="list">
    <slot></slot>
  </q-list>
</template>

<script setup>
import {
  onMounted,
  ref
} from 'vue';

const list = ref();


onMounted(() => {
  // First disable system TAB navigation.
  const elems = list.value.$el.querySelectorAll(':scope [tabindex="0"]');
  for (let i = 0; i < elems.length; i++)
    elems[i].setAttribute('tabindex', '-1');

  // Now focus on the active element.
  const active = list.value.$el.querySelector(':scope .q-item--active');
  if (active) {
    setTimeout(() => active.focus(), 0);
  }
});

function onKeyDown(ev) {
  if (ev.key === 'Enter' || ev.key === 'Escape') {
    // Qmenu/QBtn will handle the 'Enter' event.
    // Setting 'preventDefault' on the event will: 
    // - prevent Chrome from trying to handle navigation
    // - prevent our code from calling history.go(-1) on Escape.
    ev.preventDefault();
    return;
  }

  if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown')
    return;
  ev.stopPropagation();
  ev.preventDefault();
  const key = ev.key;

  setTimeout(() => {
    const elems = list.value.$el.querySelectorAll(':scope .q-item');

    for (let i = 0; i < elems.length; i++) {
      if (elems[i].matches('.q-item--active')) {
        switch (key) {
          case 'ArrowUp':
            if (i > 0) {
              elems[i-1].focus();
            }
            break;
          case 'ArrowDown':
            if (i < elems.length - 1) {
              elems[i+1].focus();
            }
            break;
        }
        break;
      }
    }
  }, 20);
}
</script>
