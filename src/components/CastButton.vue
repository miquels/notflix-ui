<template>
  <google-cast-launcher :style="castClass"></google-cast-launcher>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'CastButton',
  props: {
    size: ref(24),
  },
  setup(props) {
    const sizing = {
      width: props.size || '32px',
      height: props.size || '32px',
    };
    return {
      castClass: sizing,
    };
  },
});
</script>
