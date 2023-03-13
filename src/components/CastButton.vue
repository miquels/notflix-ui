<template>
  <google-cast-launcher
    class="castbutton"
    :style="castStyle"
    tabindex="0"
  />
</template>

<style lang="scss">
.castbutton:hover, .castbutton:focus-inside {
  background-color: #222222;
  outline: none;
}
</style>

<script setup>
import { useQuasar } from 'quasar';

const props = defineProps({
  size: {
    type: Number,
    default: 28,
  },
});

const castStyle = {
  width: `${props.size}px`,
  height: `${props.size}px`,
};
</script>
