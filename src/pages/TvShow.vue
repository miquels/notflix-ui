<template>
  <q-page class="flex-center">
    <TvShow :collection="collection" :id="id"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import TvShow from 'components/TvShow.vue';

export default defineComponent({
  name: 'PageTvShow',
  components: {
    TvShow,
  },

  setup() {
    const route = useRoute();
    console.log('params:', route.params);
    return {
      collection: route.params.collection,
      id: route.params.id,
    };
  },
});
</script>
