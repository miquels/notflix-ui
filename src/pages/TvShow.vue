<template>
  <q-page class="flex-center">
    <TvShow :collection="collection" :name="name"/>
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
      // collection: route.params.collection,
      // XXX FIMXE
      collection: 'TV%20Shows',
      name: route.params.name,
    };
  },
});
</script>
