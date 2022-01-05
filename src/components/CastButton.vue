<template>
  <q-icon
    name="cast"
        v-if="castState === 'disconnected'"
        :size="size || '24px'"
        @click="emitter.emit('cast')"
  />
</template>

<script>
import {
  defineComponent,
  inject,
} from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'CastButton',
  setup() {
    const emitter = inject('emitter');
    const store = useStore();
    const { castState } = store.getters;

    return {
      emitter,
      castState,
    };
  },
});
</script>
