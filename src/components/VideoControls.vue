<template>
    <lrud>
    <div
       class=videocontrols-container
       ref="el"
       @mouseleave="onMouseLeave($event)"
       @mousemove.capture="onMouseMove($event)"
       @touchstart.passive.capture="onTouchStart($event)"
       @touchend.capture="onTouchEnd($event)"
       @focusin="onControlsFocusIn()"
    >
      <div class="row q-mx-md videocontrols-slider-div">
        <lrud no-nav-inside tabindex="0" :center-x=0>
        <q-slider
           :modelValue="currentTime"
           @update:modelValue="(val) => { seekTo = val; }"
           @change="seek(seekTo)"
           @mousedown.capture="onControlsFocusIn()"
           @keydown.capture.stop.up="onControlsFocusOut(800)"
           @keydown.stop.enter="$emit('play')"
           @keydown.capture.stop.left="seek(currentTime - 15)"
           @keydown.capture.stop.right="seek(currentTime + 15)"
           @keydown.stop.m="seek(currentTime + 15)"
           @focusin="onSliderFocusIn"
           @focusout="onSliderFocusOut"
           :min="0"
           :max="duration || 1"
           :step="0"
           :color="sliderColor"
           :inner-track-color="sliderTrackColor"
           :label="!!this.duration"
           :label-value="hhmmss(seekTo || currentTime)"
           dark
           ref="sliderEl"
           class=" videocontrols-slider"
        />
        </lrud>
      </div>
      <lrud>
      <div class="row q-pb-sm">
        <div class="col-auto q-ml-sm">
          <q-icon
            name="stop" v-if="stopButton" size="32px"
            class="on-left hover-pointer focus-white" @click="$emit('stop')"
            tabindex="0"
          />
          <q-icon
            :name="play_icon()" size="32px"
            class="on-left hover-pointer focus-white" @click="$emit('play')"
            tabindex="0"
          />
          <q-icon
            :name="volume_icon()" size="32px"
            class="on-left hover-pointer focus-white" @click="$emit('mute')"
            tabindex="0"
          />
          <span class="on-left" v-if="duration">{{ time_info() }}</span>
        </div>
        <div v-if="deviceName" class="col-5 gt-xs q-ml-sm self-center text-right">
          <span class="text-uppercase">{{ nowPlaying() }}</span>
          <span>{{ onDevice() }}</span>
        </div>
        <div class="col"></div>
        <div class="col-auto q-mr-sm">
          <lrud no-nav-inside>
          <q-icon
            v-if="audioTracks.length > 1"
            name="language" size="32px"
            class="on-right hover-pointer focus-white"
            tabindex="0"
            @keydown.enter.stop=''
          >
            <q-menu
              anchor="top end"
              self="bottom right"
              class="videocontrols-fix-zindex"
              @show="menuOpen()"
              @hide="menuClose()"
            >
              <q-list-kbd-nav style="min-width: 10em" bordered dense>
                <q-item
                  v-for="a in audioTracks"
                  :key="a.id"
                  v-close-popup
                  clickable
                  :active="audioTrack === a.id"
                  @click="$emit('audiotrack', a.id)"
                  @focus="audioTrack = a.id"
                >
                  {{a.label}}
                </q-item>
              </q-list-kbd-nav>
            </q-menu>
          </q-icon>
          </lrud>

          <lrud no-nav-inside>
          <q-icon
           v-if="textTracks.length"
           name="closed_caption" size="32px"
           class="on-right hover-pointer focus-white"
           tabindex="0"
           @keydown.enter.stop=''
          >
            <q-menu
              anchor="top end"
              self="bottom right"
              class="videocontrols-fix-zindex"
              @show="menuOpen()"
              @hide="menuClose()"
            >
              <q-list-kbd-nav style="min-width: 10em" bordered dense>
                <q-item
                  v-for="(s, index) in textTracks"
                  :key="s.id"
                  v-close-popup
                  clickable
                  :active="textTrack === s.id"
                  @click="$emit('texttrack', s.id)"
                  @focus="setTextTrack(s.id, index)"
                >
                  {{s.label}}
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :active="textTrack === null"
                  @click="$emit('texttrack', null)"
                  @focus="setTextTrack(null, -1)"
                >
                  Off
                </q-item>
              </q-list-kbd-nav>
            </q-menu>
          </q-icon>
          </lrud>

          <q-icon
            :name="'airplay'"
            size="32px"
            class="on-right hover-pointer focus-white"
            v-if="airplayAvailable"
            @click="$emit('airplay')"
            tabindex="0"
          />
          <q-icon
            :name="cast_icon()"
            size="32px"
            class="on-right hover-pointer focus-white"
            v-if="castState && castState !== 'no_devices'"
            @click="$emit('cast')"
            tabindex="0"
          />
          <q-icon
            :name="fullscreen_icon()"
            size="32px"
            class="on-right hover-pointer focus-white"
            v-if="!!fullScreenState"
            @click="$emit('fullscreen')"
            tabindex="0"
          />
        </div>
      </div>
      </lrud>
    </div>
    </lrud>
</template>

<style>
.videocontrols-container {
  position: relative;
  width: 100%;
  color: #bbbbbb;
}
.videocontrols-slider-div {
  position: relative;
}
.videocontrols-slider {
  color: #dddddd;
}
.videocontrols-slider:focus {
  color: #ffffff;
  outline: none;
}
.videocontrols-fix-zindex {
  z-index: 7001;
}
</style>
<script>
import {
  defineComponent,
  onMounted,
  ref,
  toRaw,
} from 'vue';
import { useStore } from 'vuex';
import { hhmmss } from '../lib/util.js';
import QListKbdNav from './QListKbdNav.vue';

export const ControlsEvent = {
  IDLE: 'controls_idle',
  CLOSE: 'controls_idle',
  ACTIVE: 'controls_active',
};
Object.freeze(ControlsEvent);

export default defineComponent({
  name: 'VideoControls',
  emits: [
    'play', 'seek', 'volume', 'texttrack', 'audiotrack',
    'fullscreen', 'cast', 'stop', 'controlsActive', 'mute', 'airplay',
  ],
  components: {
    QListKbdNav,
  },
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

  setup(props) {
    const el = ref(null);
    const sliderEl = ref(null);
    const store = useStore();
    let textTrack = ref(props.textTrack);
    let audioTrack = ref(props.audioTrack);

    onMounted(() => {
      // console.log('sliderEl', sliderEl.value);
      setTimeout(() => sliderEl.value.$el.focus(), 0);
    });

    return {
      sliderColor: ref('blue-10'),
      sliderTrackColor: ref('grey-8'),
      showLabel: ref(false),
      cur_play_icon: 'play_arrow',
      isActive: false,
      isMenuOpen: false,
      seekTo: 0,
      hhmmss,
      store,
      el,
      sliderEl,
      textTrack,
      audioTrack,
    };
  },

  methods: {
    setTextTrack(track, index) {
      console.log('setTextTrack id', track, 'index', index);
      this.textTrack = track;
    },

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
      let newTime = toRaw(seekTo);
      if (newTime < 0)
        newTime = 0;
      this.$emit('seek', Math.floor(newTime));
      this.seekTo = 0;
      if (this.playState === 'ended') {
        this.$emit('play');
      }
    },

    menuOpen() {
      if (!this.isActive) {
        this.$emit('controlsActive', ControlsEvent.ACTIVE);
      }
      this.isActive = true;
      this.isMenuOpen = true;
    },

    menuClose() {
      if (this.isTouch) {
        this.$emit('controlsActive', ControlsEvent.IDLE);
      }
      this.isMenuOpen = false;
    },

    onMouseMove() {
      if (!document.hasFocus() || this.isTouch) return;
      // console.log('onMouseMove');
      // if (!this.isActive && !this.isMenuOpen) {
      this.$emit('controlsActive', ControlsEvent.ACTIVE);
      this.isActive = true;
    },

    onMouseLeave() {
      if (this.isTouch) return;
      // console.log('onMouseLeave');
      if (this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', ControlsEvent.IDLE);
      }
      // console.log('onMouseLeave');
      this.isActive = false;
    },

    onTouchStart() {
      // console.log('onTouchStart');
      this.isTouch = true;
      if (!this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', ControlsEvent.ACTIVE);
      }
      this.isActive = true;
    },

    onTouchEnd() {
      // console.log('onTouchEnd');
      this.isTouch = true;
      if (this.isActive && !this.isMenuOpen) {
        this.$emit('controlsActive', ControlsEvent.IDLE);
      }
      this.isActive = false;
    },

    onControlsFocusIn() {
      if (this.isTouch) return;
      // console.log('sliderFocusIn');
      if (!this.isActive) {
        this.$emit('controlsActive', ControlsEvent.ACTIVE);
      }
      this.isActive = true;
      this.isMenuOpen = false;
    },

    onControlsFocusOut(fromKey) {
      if (this.isTouch) return;
      if (this.isActive) {
        this.$emit('controlsActive', fromKey ? ControlsEvent.OFF : ControlsEvent.IDLE);
      }
      this.isMenuOpen = false;
      this.isActive = false;
    },

    onSliderFocusIn() {
      this.sliderColor = 'blue-3';
      this.sliderTrackColor = 'grey-7';
    },

    onSliderFocusOut() {
      this.sliderColor = 'blue-10';
      this.sliderTrackColor = 'grey-8';
    }
  },
});
</script>
