<template>
  <google-cast-launcher :style="castStyle"></google-cast-launcher>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CastButton',
  props: {
    size: {
      type: Number,
      default: 32,
    },
  },
  setup(props) {
    const castStyle = {
      width: `${props.size}px`,
      height: `${props.size}px`,
    };
    return {
      castStyle,
    };
  },
});
</script>
