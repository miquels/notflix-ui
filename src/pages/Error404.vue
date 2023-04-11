<template>
  <lrud>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center" v-autofocus>
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        Oops. Nothing here...
      </div>

      <div class="text-small" style="opacity:.4">
        {{ $route.params.catchAll }}
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Home"
        no-caps
        v-focus="1"
      />
    </div>
  </div>
  </lrud>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Error404',
});
</script>
