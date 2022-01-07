<template>

    <div class=videocontrols-container ref="el">
      <div class="row q-mx-md videocontrols-label">
        <q-badge color="blue" v-show="showLabel" class="videocontrols-label-badge" ref="badgeEl"
           :style="{ 'left': `${labelPos}px` }">{{ labelTime }}</q-badge>
      </div>
      <div class="row q-mx-md videocontrols-slider">
        <q-slider
           :modelValue="currentTime"
           @update:modelValue="seek"
           :min="0"
           :max="duration || 1"
           :step="0"
           color="red"
           dark
           @mouseleave="mouseleave($event)"
           @mousemove="mousemove($event)"
           ref="sliderEl"
        />
      </div>
      <div class="row q-pb-sm">
        <div class="col-auto q-ml-sm">
          <q-icon name="stop" v-if="stopButton" size="24px" class="on-left" @click="$emit('stop')"/>
          <q-icon :name="play_icon()" size="24px" class="on-left" @click="$emit('play')"/>
          <q-icon name="volume_up" size="24px" class="on-left"/>
          <span class="on-left" v-if="duration">{{ time_info() }}</span>
        </div>
        <div class="col"></div>
        <div class="col-auto q-mr-sm">

          <q-icon name="language" size="24px" class="on-right" v-if="audioTracks.length > 1">
            <q-menu anchor="top end" self="bottom right" class="videocontrols-fix-zindex">
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

          <q-icon name="closed_caption" size="24px" class="on-right" v-if="textTracks.length">
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
            :name="cast_icon()"
            size="24px"
            class="on-right"
            v-if="castState && castState !== 'no_devices'"
            @click="$emit('cast')"
          />
          <q-icon
            :name="fullscreen_icon()"
            size="24px"
            class="on-right"
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
.videocontrols-label{
  position: relative;
  overflow: hidden;
}
.videocontrols-label-badge {
  position: relative;
}
</style>
<script>
import {
  defineComponent,
  ref,
} from 'vue';
import { debounce } from '../lib/util.js';

function hhmmss(seconds) {
  const d = new Date(seconds * 1000).toISOString();
  if (seconds >= 3600) {
    return d.substr(11, 8);
  }
  return d.substr(14, 5);
}

export default defineComponent({
  name: 'VideoControls',
  emits: ['play', 'seek', 'volume', 'texttrack', 'audiotrack', 'fullscreen', 'cast'],

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
      labelTime: ref('00:00'),
      labelPos: ref(0),
      badgeEl: ref(null),
      sliderEl: ref(null),
      cur_play_icon: 'play_arrow',
      dSeek: null,
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
      if (this.castState === 'connected') {
        return 'cast_connected';
      }
      return 'cast';
    },

    seek(newTime) {
      if (!this.dSeek) {
        this.dSeek = debounce((dTime) => {
          // console.log('seekTo', dTime);
          this.$emit('seek', Math.floor(dTime));
          if (this.playState === 'ended') {
            this.$emit('play');
          }
        }, 250, true);
      }
      this.dSeek(newTime);
    },

    mouseleave() {
      this.showLabel = false;
    },

    mousemove(ev) {
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

      this.showLabel = true;
      this.labelPos = x;
      this.labelTime = hhmmss(tm);
    },
  },
});
</script>
