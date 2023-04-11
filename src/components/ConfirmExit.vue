<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" @keydown.capture.stop.escape='' v-autofocus>
    <lrud>
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <q-avatar icon="logout" color="primary" text-color="white" />
        <span class="q-ml-sm">Exit Notflix?.</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" tabindex="0" label="OK" @click="onDialogOK" v-focus="1" />
        <q-btn color="primary" tabindex="0" label="Cancel" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
    </lrud>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>
