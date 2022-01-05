<template>
  <q-page class="flex-center">
    <div class="row justify-center">
      <div class="col-12 col-sm-10">
        <Movie :collection="collection" :name="name"/>
      </div>
    </div>
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
    console.log('params:', route.params);
    return {
      // collection: route.params.collection,
      // XXX FIMXE
      collection: 'Movies',
      name: route.params.name,
    };
  },
});
</script>
