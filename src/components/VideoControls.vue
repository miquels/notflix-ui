<template>
    <div class=videocontrols-container ref="el">
      <div class="row q-mx-md videocontrols-hover-label">
        <q-badge color="blue" v-show="showBadge" class="videocontrols-hover-badge q-pa-sm"
           ref="badgeEl" :style="{ 'left': `${badgePos}px` }">{{ badgeTime }}</q-badge>
      </div>
      <div class="row q-mx-md videocontrols-slider">
        <q-slider
           :modelValue="currentTime"
           @update:modelValue="(val) => { seekTo = val; showBadge = false; }"
           @change="seek(seekTo)"
           :min="0"
           :max="duration || 1"
           :step="0"
           color="red"
           :label="showLabel"
           :label-value="hhmmss(seekTo)"
           dark
           @mouseleave="mouseleave($event)"
           @mousemove="mousemove($event)"
           @touchmove.passive.capture="mousemove($event)"
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
          <q-icon name="volume_up" size="32px" class="on-left hover-pointer"/>
          <span class="on-left" v-if="duration">{{ time_info() }}</span>
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
            <q-menu anchor="top end" self="bottom right" class="videocontrols-fix-zindex">
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
            :name="airplay"
            size="32px"
            class="on-right hover-pointer"
            v-if="airplayState === 'available'"
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
.videocontrols-fix-zindex {
  z-index: 8000;
}
.videocontrols-slider {
  position: relative;
}
.videocontrols-hover-label{
  position: relative;
  overflow: hidden;
}
.videocontrols-hover-badge {
  position: relative;
}
</style>
<script>
import {
  defineComponent,
  ref,
  toRaw,
} from 'vue';
import { hhmmss } from '../lib/util.js';

export default defineComponent({
  name: 'VideoControls',
  emits: ['play', 'seek', 'volume', 'texttrack', 'audiotrack', 'fullscreen', 'cast', 'stop'],

  props: {
    currentTime: Number,
    playState: String,
    volume: Number,
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
    airplayState: {
      type: Boolean,
      default: false,
    },
    fullScreenState: String,
    stopButton: {
      type: Boolean,
      default: false,
    },
  },

  setup() {
    const el = ref(null);
    return {
      showLabel: ref(false),
      showBadge: ref(false),
      badgeTime: ref('00:00'),
      badgePos: ref(0),
      badgeEl: ref(null),
      sliderEl: ref(null),
      cur_play_icon: 'play_arrow',
      hhmmss,
      seekTo: 0,
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

    menuActive(ev) {
      console.log(ev);
    },

    seek(seekTo) {
      const newTime = toRaw(seekTo);
      this.$emit('seek', Math.floor(newTime));
      if (this.playState === 'ended') {
        this.$emit('play');
      }
    },

    mouseleave() {
      // console.log('mouseleave', ev);
      // this.showLabel = false;
      this.showBadge = false;
    },

    mousemove(ev) {
      // console.log('mousemove');
      if (!this.sliderEl || !this.badgeEl) {
        return;
      }
      this.showLabel = !!this.duration;
      this.showBadge = this.showLabel && !ev.touches;
      if (!this.showBadge) {
        return;
      }

      const sliderWidth = this.sliderEl.$el.clientWidth;
      const badgeWidth = this.badgeEl.$el.clientWidth;
      const sliderPos = this.sliderEl.$el.getBoundingClientRect();

      let pos = ev.pageX - sliderPos.left;
      if (pos < 0) pos = 0;
      if (pos > sliderWidth) pos = sliderWidth;
      const tm = (pos / sliderWidth) * this.duration;

      let x = pos - badgeWidth / 2;
      if (x < 0) x = 0;
      if (x > sliderWidth - badgeWidth) x = sliderWidth - badgeWidth;

      this.badgePos = x;
      this.badgeTime = hhmmss(tm);
    },
  },
});
</script>
