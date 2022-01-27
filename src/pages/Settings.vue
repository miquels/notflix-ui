<template>
  <div class="row justify-center">
    <div class="col-auto text-h4">Settings</div>
  </div>
  <div class="row q-pa-md">

    <q-card dark bordered class="col q-ma-md bg-grey-10 my-card">
      <q-card-section>
        <div class="text-h6">Chromecast</div>
      </q-card-section>
      <q-separator dark inset />
      <q-card-section>
        <q-option-group
          :options="castOptions"
          type="radio"
          v-model="castSelected"
        />
        <q-input
          v-model="castReceiverId"
          :disable="castSelected !== 'custom'"
          :rules="[ val => checkReceiverId(val) || 'Please enter a 6-digit hex number' ]"
          placeholder="Custom Receiver Id"
          dark
          clearable
          hide-bottom-space
          dense
          label-color="white"
          color="white"
          class="q-px-md"
        />
      </q-card-section>
    </q-card>

    <q-card dark bordered class="col q-ma-md bg-grey-10 my-card">
      <q-card-section>
        <div class="text-h6">iPhone / iPad</div>
      </q-card-section>
      <q-separator dark inset />
      <q-card-section>
        <q-option-group
          :options="iosOptions"
          type="checkbox"
          v-model="iosSelected"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 250px
</style>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
} from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'Settings',

  setup() {
    const store = useStore();

    const castOptions = ref([
      { label: 'Notflix Receiver', value: 'notflix' },
      { label: 'Default Media Receiver', value: 'default' },
      { label: 'Custom Receiver', value: 'custom' },
    ]);
    const castSelected = ref('notflix');
    const castReceiverId = ref('');

    const iosOptions = ref([
      { label: 'Use system video player', value: 'nativeVideo' },
      { label: 'HLS.js: use native HLS', value: 'nativeHls' },
    ]);
    const iosSelected = ref([]);

    onMounted(() => {

      switch (store.state.config.castReceiver) {
        case 'notflix':
          castSelected.value = 'notflix';
          break;
        case 'default':
          castSelected.value = 'default';
          break;
        default:
          castSelected.value = 'custom';
          castReceiverId.value = store.state.config.castReceiver;
          break;
      }

      if (store.state.config.iosNativeVideo) iosSelected.value.push('nativeVideo');
      if (store.state.config.iosNativeHls) iosSelected.value.push('nativeHls');
    });

    onUnmounted(() => {
      switch (castSelected.value) {
        case 'notflix':
          store.commit('castReceiver', 'notflix');
          break;
        case 'default':
          store.commit('castReceiver', 'default');
          break;
        default:
          store.commit('castReceiver', castSelected.value);
          break;
      }
      store.commit('iosNativeVideo', iosSelected.value.includes('nativeVideo'));
      store.commit('iosNativeHls', iosSelected.value.includes('nativeHls'));
    });

    return {
      castOptions,
      castSelected,
      castReceiverId,
      iosOptions,
      iosSelected,
    };
  },

  methods: {
    checkReceiverId(val) {
      if (this.castSelected !== 'custom' || !val) return true;
      return val.match(/^[0-9a-fA-F]{6}$/) !== null;
    },
  },

});
</script>
