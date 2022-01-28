<template>
  <teleport to="body">
    <div class="ios-player-container z-top" draggable="false">
      <IosVideo />
    </div>
  </teleport>
</template>

<style>
.ios-player-container {
  display: flex;
  position: absolute;
  left: 0px;
  top: 0px;
  padding: 0px;
  margin: 0px;
  width: 100vw;
  height: 100vh;
  background-color: black;
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
