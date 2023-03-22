<template>
  <q-page class="flex-center">
    <TvShow :collection="collection" :id="id" :fromRoute="fromRoute"/>
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
  props: {
    fromRoute: Object,
  },
  setup() {
    const route = useRoute();
    return {
      collection: route.params.collection,
      id: route.params.id,
    };
  },
});
</script>
