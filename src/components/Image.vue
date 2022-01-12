<template>
  <img v-if="src" :src="src">
  <div v-else class="image-name">{{ name }}</div>
</template>

<style>
.image-name {
  font-size: 16px;
  color: white;
  overflow-wrap: break-word;
  hyphens: manual;
  background: #333333;
}
</style>

<script>
import {
  defineComponent,
} from 'vue';

export default defineComponent({
  name: 'Image',
  props: {
    src: String,
    name: String,
  },
});
</script>
