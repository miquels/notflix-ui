<template>
  <div
    class="video-container"
    :class="{ 'cursor-none': !showcontrols}"
    @mousemove="mouse(1, $event)"
    @mouseleave="mouse(0, $event)"
    @click="container_clicked"
    ref="el"
  >
    <video :src="this.url" class="video" ref="video"></video>
    <q-slide-transition appear :duration="50">
    <div class="controls" v-if="showcontrols" @click.stop="" @mousemove="mouse(2, $event)">
        <div class="row q-mx-md">
          <q-slider
             v-model="slider"
             @update:model-value="slider_updated"
             :min="0"
             :max="100"
             :step="0"
             color="red"
             dark
         />
      </div>
      <div class="row q-pb-sm">
        <div class="col-auto q-ml-sm">
          <q-icon :name="play_icon" size="24px" class="on-left" @click="play()"/>
          <q-icon name="volume_up" size="24px" class="on-left"/>
          <span class="on-left" v-if="duration">{{ time_info() }}</span>
        </div>
        <div class="col"></div>
        <div class="col-auto q-mr-sm">

          <q-icon name="language" size="24px" class="on-right" v-if="audiotracks.length > 1">
            <q-menu anchor="top end" self="bottom right">
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="a in audiotracks"
                  :key="a.idx"
                  v-close-popup
                  clickable
                  :active="audiotrack === a.idx"
                  @click="audiotrack_activate(a.idx)"
                >
                  {{a.label}}
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>

          <q-icon name="closed_caption" size="24px" class="on-right" v-if="subtitles.length">
            <q-menu anchor="top end" self="bottom right">
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="s in subtitles"
                  :key="s.idx"
                  v-close-popup
                  clickable
                  :active="subtitle === s.idx"
                  @click="subtitle_activate(s.idx)"
                >
                  {{s.label}}
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :active="subtitle === null"
                  @click="subtitle_activate(null)"
                >
                  Off
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>

          <q-icon name="cast" size="24px" class="on-right"/>
          <q-icon
            :name="fullscreen_icon"
            size="24px"
            class="on-right"
            @click="toggle_fullscreen()"
          />
        </div>
      </div>
    </div>
    </q-slide-transition>
  </div>
</template>

<style>
.video-container {
  position: relative;
  background: black;
}
.video {
  width: 640px;
  display: block;
}
.controls {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%);
  color: white;
}
</style>

<script>
import Hls from 'hls.js';
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  ref,
} from 'vue';
import { useQuasar } from 'quasar';

function hhmmss(seconds) {
  const d = new Date(seconds * 1000).toISOString();
  if (seconds < 3600) {
    return d.substr(11, 8);
  }
  return d.substr(14, 5);
}

export default defineComponent({
  name: 'VideoPlayer',
  props: {
    url: {
      type: String,
      default: '#',
    },
  },
  setup() {
    onMounted(() => {
      const instance = getCurrentInstance();
      instance.ctx.init_video();
    });

    const hls = new Hls();
    window.hls = hls;

    return {
      video: ref(null),
      showcontrols: ref(2),
      slider: ref(0),
      moved_timer: null,
      play_icon: ref('play_arrow'),
      playing: false,
      ended: false,
      duration: ref(null),
      current: ref(0),
      hls,
      subtitles: ref([]),
      subtitle: ref(null),
      audiotracks: ref([]),
      audiotrack: ref(0),
      el: ref(null),
      quasar: useQuasar(),
      fullscreen_icon: ref('fullscreen'),
    };
  },

  methods: {

    // Called when the mouse is moved. Used to display the mouse
    // pointer and the video controls.
    mouse(showcontrols, ev) {
      if (this.moved_timer) {
        clearTimeout(this.moved_timer);
        this.moved_timer = null;
      }
      if (showcontrols === 0) {
        if (ev.layerX >= 0 && ev.layerX < this.el.clientWidth
            && ev.layerY >= 0 && ev.layerY < this.el.clientHeight) {
          // spurious mouseleave event, because of teleported elements.. :(
          console.log('bad mouseleave', ev);
          return;
        }
      }
      if (!this.playing) {
        showcontrols = 2;
      }
      if (showcontrols === 1 && this.showcontrols < 2) {
        this.moved_timer = setTimeout(() => { this.showcontrols = 0; }, 2000);
      }
      this.showcontrols = showcontrols;
    },

    // Add all the event listeners we need to the <video> element.
    init_video() {
      this.video.addEventListener('ended', () => { this.playing = false; this.showcontrols = 2; });
      this.video.addEventListener('canplay', () => {
        this.current = this.video.currentTime || 0;
        this.duration = this.video.duration;
        this.slider = (this.current / this.duration) * 100;
      });
      this.video.addEventListener('timeupdate', () => {
        this.current = this.video.currentTime;
        this.slider = (this.current / this.duration) * 100;
      });
      this.video.addEventListener('ended', () => {
        this.ended = true;
        this.playing = false;
        this.play_icon = 'replay';
      });
      this.video.textTracks.addEventListener('addtrack', () => this.on_subtitles());
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MANIFEST_LOADED, () => this.on_manifest());
      this.hls.loadSource(this.url);
      window.video = this.video;
    },

    on_subtitles() {
      this.subtitles.length = 0;
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        const t = this.video.textTracks[i];
        if (t.kind === 'subtitles') {
          this.subtitles.push({
            idx: i,
            label: t.label,
          });
        }
      }
    },

    on_manifest() {
      this.audiotracks.length = 0;
      for (let i = 0; i < this.hls.audioTracks.length; i += 1) {
        const t = this.hls.audioTracks[i];
        this.audiotracks.push({
          idx: i,
          label: t.name,
        });
      }
    },

    // current time and duration info: 00:08:51 / 20:00:00.
    time_info() {
      if (!this.duration) {
        return '';
      }
      return `${hhmmss(this.current)} / ${hhmmss(this.duration)}`;
    },

    // Event: play / pause / reload was clicked.
    play() {
      if (this.ended) {
        this.video.currentTime = 0;
        this.ended = false;
      }
      if (this.playing) {
        this.playing = false;
        this.play_icon = 'play_arrow';
        this.video.pause();
      } else {
        this.playing = true;
        this.play_icon = 'pause';
        this.video.play();
      }
    },

    container_clicked() {
      if (!this.ended) {
        this.play();
      }
    },

    // Event: slider was updated by user.
    slider_updated(pct) {
      if (this.ended) {
        this.ended = false;
        this.play_icon = 'play_arrow';
      }
      console.log('slider updated', pct);
      this.current = (this.duration * pct) / 100;
      this.video.currentTime = this.current;
    },

    subtitle_activate(idx) {
      console.log('idx', idx);
      if (this.subtitle !== null) {
        this.video.textTracks[this.subtitle].mode = 'disabled';
      }
      if (idx != null) {
        this.video.textTracks[idx].mode = 'showing';
      }
      this.subtitle = idx;
    },

    audiotrack_activate(idx) {
      console.log('idx', idx);
      this.audiotrack = idx;
      this.hls.audioTrack = idx;
    },

    toggle_fullscreen() {
      if (this.quasar.fullscreen.isActive) {
        this.quasar.fullscreen.exit().then(() => { this.fullscreen_icon = 'fullscreen'; });
      } else {
        this.quasar.fullscreen.request(this.el).then(() => { this.fullscreen_icon = 'fullscreen_exit'; });
      }
    },

  },
});
</script>
