<template>
  <q-page class="flex-center">
    <div class="row justify-center">
      <div class="col-12 col-sm-10">
        <TvShow :collection="collection" :name="name"/>
      </div>
    </div>
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
