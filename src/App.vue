<template>
  <router-view />
</template>
<script>
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';
import { fixQuasarPlatform, fixQuasarCss } from 'src/lib/android-tv.js';

var noVideoCacheOnDevice = false;

const fetch = window.fetch;
window.fetch = function(url, options) {
  if (noVideoCacheOnDevice && (url.endsWith('.mp4') || url.endsWith('.m4a'))) {
    options ||= {};
    options.cache = 'no-store';
  }
  return fetch(url, options);
};

export default defineComponent({
  name: 'App',
  setup() {
    const $q = useQuasar();
    $q.dark.set(true);
    fixQuasarPlatform();
    if ($q.platform.is.tv || $q.platform.is.mobile) {
      noVideoCacheOnDevice = true;
    }
  },
  mounted() {
    fixQuasarCss();
  },
});
</script>
