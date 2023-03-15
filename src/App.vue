<template>
  <router-view />
</template>
<script>
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';
import { fix_quasar_platform, fix_quasar_css } from 'src/lib/android-tv.js';

export default defineComponent({
  name: 'App',
  setup() {
    const $q = useQuasar();
    $q.dark.set(true);
    fix_quasar_platform();
  },
  mounted() {
    fix_quasar_css();
  },
});
</script>
