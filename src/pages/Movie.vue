<template>
  <q-page class="flex-center">
    <Movie :collection="collection" :id="id"/>
  </q-page>
</template>

<script>
import {
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import Movie from 'components/Movie.vue';

export default defineComponent({
  name: 'PageMovie',
  components: {
    Movie,
  },

  setup() {
    const route = useRoute();
    // console.log('params:', route.params);
    return {
      collection: route.params.collection,
      id: route.params.id,
    };
  },
});
</script>
