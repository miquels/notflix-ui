<template>
    <div
       class=videocontrols-container
       ref="el"
       @mouseleave="onMouseLeave($event)"
       @mousemove.capture="onMouseMove($event)"
       @touchstart.passive.capture="onTouchStart($event)"
       @touchend.capture="onTouchEnd($event)"
    >
      <div class="row q-mx-md videocontrols-slider">
        <q-slider
           :modelValue="currentTime"
           @update:modelValue="(val) => { seekTo = val; }"
           @change="seek(seekTo); onSliderFocusOut()"
           @mousedown.capture="onSliderFocusIn()"
           :min="0"
           :max="duration || 1"
           :step="0"
           color="blue"
           :label="!!this.duration"
           :label-value="hhmmss(seekTo || currentTime)"
           dark
           ref="sliderEl"
        />
      </div>
      <div class="row q-pb-sm">
        <div class="col-auto q-ml-sm">
          <q-icon
            name="stop" v-if="stopButton" size="32px"
            class="on-left hover-pointer" @click="$emit('stop')"
          />
          <q-icon
            :name="play_icon()" size="32px"
            class="on-left hover-pointer" @click="$emit('play')"
          />
          <q-icon
            :name="volume_icon()" size="32px"
            class="on-left hover-pointer" @click="$emit('mute')"
          />
          <span class="on-left" v-if="duration">{{ time_info() }}</span>
        </div>
        <div v-if="deviceName" class="col-5 gt-xs q-ml-sm self-center text-right">
          <span class="text-uppercase">{{ nowPlaying() }}</span>
          <span>{{ onDevice() }}</span>
        </div>
        <div class="col"></div>
        <div class="col-auto q-mr-sm">
          <q-icon
            name="language" size="32px"
            class="on-right hover-pointer" v-if="audioTracks.length > 1"
          >
            <q-menu
              anchor="top end"
              self="bottom right"
              class="videocontrols-fix-zindex"
              @show="menuOpen()"
              @hide="menuClose()"
            >
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="a in audioTracks"
                  :key="a.id"
                  v-close-popup
                  clickable
                  :active="audioTrack === a.id"
                  @click="$emit('audiotrack', a.id)"
                >
                  {{a.label}}
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>

          <q-icon
            name="closed_caption" size="32px"
           class="on-right hover-pointer" v-if="textTracks.length"
          >
            <q-menu
              anchor="top end"
              self="bottom right"
              class="videocontrols-fix-zindex"
              @show="menuOpen()"
              @hide="menuClose()"
            >
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="s in textTracks"
                  :key="s.id"
                  v-close-popup
                  clickable
                  :active="textTrack === s.id"
                  @click="$emit('texttrack', s.id)"
                >
                  {{s.label}}
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :active="textTrack === null"
                  @click="$emit('texttrack', null)"
                >
                  Off
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>

          <q-icon
            :name="'airplay'"
            size="32px"
            class="on-right hover-pointer"
            v-if="airplayAvailable"
            @click="$emit('airplay')"
          />
          <q-icon
            :name="cast_icon()"
            size="32px"
            class="on-right hover-pointer"
            v-if="castState && castState !== 'no_devices'"
            @click="$emit('cast')"
          />
          <q-icon
            :name="fullscreen_icon()"
            size="32px"
            class="on-right hover-pointer"
            v-if="!!fullScreenState"
            @click="$emit('fullscreen')"
          />
        </div>
      </div>
    </div>
</template>

<style>
.videocontrols-container {
  position: relative;
  width: 100%;
}
.videocontrols-slider {
  position: relative;
}
.videocontrols-fix-zindex {
  z-index: 7001;
}
</style>
<script>
import {
  defineComponent,
  ref,
  toRaw,
} from 'vue';
import { useStore } from 'vuex';
import { hhmmss } from '../lib/util.js';

export default defineComponent({
  name: 'VideoControls',
  emits: [
    'play', 'seek', 'volume', 'texttrack', 'audiotrack',
    'fullscreen', 'cast', 'stop', 'controlsActive', 'mute', 'airplay',
  ],

  props: {
    currentTime: Number,
    playState: String,
    volume: Number,
    muted: Boolean,
    duration: Number,
    textTrack: {
      type: Number,
      default: 0,
    },
    textTracks: {
      type: Array,
      default: () => [],
    },
    audioTrack: {
      type: Number,
      default: 0,
    },
    audioTracks: {
      type: Array,
      default: () => [],
    },
    castState: String,
    airplayAvailable: {
      type: Boolean,
      default: false,
    },
    fullScreenState: String,
    stopButton: {
      type: Boolean,
      default: false,
    },
    videoName: String,
    deviceName: String,
  },

  setup() {
    const el = ref(null);
    const store = useStore();

    return {
      showLabel: ref(false),
      cur_play_icon: 'play_arrow',
      isActive: false,
      isMenuOpen: false,
      seekTo: 0,
      hhmmss,
      store,
      el,
    };
  },

  methods: {
    // current time and duration info: 00:08:51 / 20:00:00.
    time_info() {
      if (!this.duration) {
        return '';
      }
      return `${hhmmss(this.currentTime)} / ${hhmmss(this.duration)}`;
    },

    play_icon() {
      switch (this.playState) {
        case 'playing':
          this.cur_play_icon = 'pause';
          break;
        case 'paused':
          this.cur_play_icon = 'play_arrow';
          break;
        case 'ended':
          this.cur_play_icon = 'replay';
          break;
        default:
          break;
      }
      return this.cur_play_icon;
    },

    volume_icon() {
      return this.muted ? 'volume_off' : 'volume_up';
    },

    fullscreen_icon() {
      if (this.fullScreenState === 'on') {
        return 'fullscreen_exit';
      }
      return 'fullscreen';
    },

    cast_icon() {
      // console.log('castState is', this.castState);
      if (this.castState === 'connected') {
        return 'cast_connected';
      }
      return 'cast';
    },

    nowPlaying() {
      const { castState } = this.store.state;
      if (castState === 'connected' && this.videoName) {
        return `${this.videoName}`;
      }
      return '';
    },

    onDevice() {
      const { castState } = this.store.state;
      if (castState === 'connecting') {
        return `Connecting to ${this.deviceName}`;
      }
      if (castState !== 'connected') {
        return '';
      }
      if (castState === 'connected' && this.videoName) {
        return ` on ${this.deviceName}`;
      }
      return `Connected to ${this.deviceName}`;
    },

    seek(seekTo) {
      const newTime = toRaw(seekTo);
      this.$emit('seek', Math.floor(newTime));
      this.seekTo = 0;
      if (this.playState === 'ended') {
        this.$emit('play');
      }
    },

    menuOpen() {
      if (!this.isActive) {
        this.$emit('controlsActive', true);
      }
      this.isActive = true;
      this.isMenuOpen = true;
    },

    menuClose() {
      this.$emit('controlsActive', false);
      this.isMenuOpen = false;
    },

    onMouseMove() {
      if (!document.hasFocus() || this.isTouch) return;
      // console.log('onMouseMove');
      // if (!this.isActive && !this.isMenuOpen) {
      this.$emit('controlsActive', true);
      this.isActive = true;
    },

    onMouseLeave() {
      if (this.isTouch) return;
      // console.log('onMouseLeave');
      if (this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', false);
      }
      // console.log('onMouseLeave');
      this.isActive = false;
    },

    onTouchStart() {
      // console.log('onTouchStart');
      this.isTouch = true;
      if (!this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', true);
      }
      this.isActive = true;
    },

    onTouchEnd() {
      // console.log('onTouchEnd');
      this.isTouch = true;
      if (this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', false);
      }
      this.isActive = false;
    },

    onSliderFocusIn() {
      if (this.isTouch) return;
      // console.log('sliderFocusIn');
      if (!this.isActive) {
        this.$emit('controlsActive', true);
      }
      this.isActive = true;
      this.isMenuOpen = true;
    },

    onSliderFocusOut() {
      if (this.isTouch) return;
      // console.log('sliderFocusOut');
      if (!this.isActive) {
        this.$emit('controlsActive', false);
      }
      this.isMenuOpen = false;
    },
  },
});
</script>
