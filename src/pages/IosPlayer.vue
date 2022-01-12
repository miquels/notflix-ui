<template>
    <div class="ios-player-container flex-center" draggable="false">
      <div class="row">
        <div class="col">
          <IosVideo fit />
        </div>
      </div>
    </div>
</template>

<style>
.ios-player-container {
  max-width: 100vw;
  max-height: 100vh;
}
</style>

<script>
import {
  defineComponent,
} from 'vue';
import IosVideo from 'components/IosVideo.vue';

export default defineComponent({
  name: 'PageIosPlayer',
  components: {
    IosVideo,
  },
});
</script>
