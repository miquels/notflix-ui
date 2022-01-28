<template>
  <div class="row justify-center">
    <div class="col-auto text-h4">Settings</div>
  </div>
  <div class="row q-pa-md">

    <q-card dark bordered class="col-auto q-ma-md bg-grey-10 my-card">
      <q-card-section>
        <div class="text-h6">Chromecast</div>
      </q-card-section>
      <q-separator dark inset />
      <q-card-section>
        <q-option-group
          :options="castOptions"
          type="radio"
          v-model="castSelected"
          @update:modelValue="castSelectedUpdated"
        />
        <q-input
          v-model="castReceiverId"
          @update:modelValue="castReceiverIdUpdated"
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

    <q-card
      v-if="quasar.platform.is.ios"
      dark bordered
      class="col-auto q-ma-md bg-grey-10 my-card"
    >
      <q-card-section>
        <div class="text-h6">iPhone / iPad</div>
      </q-card-section>
      <q-separator dark inset />
      <q-card-section>
        <q-option-group
          :options="iosVideo"
          type="radio"
          v-model="iosSelected"
          @update:modelValue="iosUpdated"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.my-card {
  min-width: 250px;
}
</style>

<script>
import {
  defineComponent,
  ref,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'Settings',

  setup() {
    const store = useStore();
    const quasar = useQuasar();

    const castOptions = [
      { label: 'Notflix Receiver', value: 'notflix' },
      { label: 'Default Media Receiver', value: 'default' },
      { label: 'Custom Receiver', value: 'custom' },
    ];
    const castSelected = ref('');
    const castReceiverId = ref('');
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

    const iosVideo = [
      { label: 'Use system video player', value: 'native' },
      { label: 'Use Notflix video player', value: 'notflix' },
    ];
    const iosSelected = ref(store.state.config.iosNativeVideo ? 'native' : 'notflix');

    return {
      castOptions,
      castSelected,
      castReceiverId,
      iosVideo,
      iosSelected,
      quasar,
    };
  },

  methods: {
    checkReceiverId(val) {
      if (this.castSelected !== 'custom' || !val) return true;
      return val.match(/^[0-9a-fA-F]{6}$/) !== null;
    },

    iosUpdated(val) {
      this.$store.commit('iosNativeVideo', val === 'native');
    },

    castReceiverIdUpdated(val) {
      this.$store.commit('castReceiver', val);
    },

    castSelectedUpdated(val) {
      if (val === 'custom') {
        if (this.castReceiverId) {
          this.$store.commit('castReceiver', this.castReceiverId);
        }
      } else {
        this.$store.commit('castReceiver', val);
      }
    },
  },

});
</script>
