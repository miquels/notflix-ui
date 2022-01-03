<template>
  <div
    class="html5video-container"
    :class="{ 'cursor-none': !showcontrols}"
    @mousemove="mouse(1, $event)"
    @mouseleave="mouse(0, $event)"
    @click="container_clicked"
    ref="el"
  >
    <video class="html5video-video" ref="video"></video>
    <q-slide-transition appear :duration="50">
      <div
        class="html5video-controls"
        v-if="showcontrols"
        @click.stop=""
        @mousemove.stop="mouse(3, $event)"
      >
        <VideoControls
           :playState="playState"
           :volume="volume"
           :currentTime="currentTime"
           :duration="duration"
           :textTrack="textTrack"
           :textTracks="textTracks"
           :audioTrack="audioTrack"
           :audioTracks="audioTracks"
           :castState="castState"
           :fullScreenState="fullScreenState"
           @play="on_play"
           @seek="on_seek"
           @volume="on_volume"
           @texttrack="on_texttrack"
           @audiotrack="on_audiotrack"
           @fullscreen="on_fullscreen"
        />
      </div>
    </q-slide-transition>
  </div>
</template>

<style>
.html5video-container {
  position: relative;
  background: black;
}
.html5video-video {
  object-fit: contain;
  width: 100%;
  display: block;
  border: 2px yellow;
}
.html5video-controls {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%);
  color: white;
}
</style>

<script>
/* eslint no-console: "off" */
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useQuasar } from 'quasar';
import VideoControls from 'components/VideoControls.vue';
import Hls from 'hls.js';

export default defineComponent({
  name: 'Html5Video',
  components: {
    VideoControls,
  },
  props: {
    src: {
      type: String,
      default: null,
    },
    startAt: {
      type: Number,
      default: null,
    },
  },
  setup() {
    onMounted(() => {
      const instance = getCurrentInstance();
      instance.ctx.on_mounted();
    });
    return {
      video: ref(null),
      playState: ref('paused'),
      volume: ref(0.5),
      currentTime: ref(0),
      duration: ref(null),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      castState: ref('off'),
      fullScreenState: ref('off'),
      showcontrols: ref(2),
      moved_timer: null,
      el: ref(null),
      quasar: useQuasar(),
      autoplay: true,
    };
  },

  methods: {

    // Initialize.
    on_mounted() {
      console.log('on_mounted');

      this.video.addEventListener('loadedmetadata', () => {
        this.metadata_loaded = true;
        if (this.hls_loaded_metadata) {
          this.on_loadedmetadata();
        }
      });
      this.video.addEventListener('play', () => { this.playState = 'playing'; if (this.showcontrols === 2) this.mouse(0); });
      this.video.addEventListener('pause', () => { this.playState = 'paused'; if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('ended', () => { this.playState = 'ended'; if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('timeupdate', () => { this.currentTime = this.video.currentTime; });
      this.video.addEventListener('volumechange', () => { this.volume = this.video.volume; });
      this.video.addEventListener('canplay', () => { if (this.autoplay) { this.autoplay = false; this.on_play(); } });

      watch(() => this.src, (newSrc, oldSrc) => {
        console.log('watch -> load', this.src, newSrc, oldSrc);
        if (newSrc !== oldSrc) {
          this.load(newSrc);
        }
      });
      if (this.src) {
        this.load(this.src);
      }
      window.video = this.video;
    },

    on_manifestloaded() {
      this.hls_loaded_metadata = true;
      if (this.metadata_loaded) {
        this.on_loadedmetadata();
      }
    },

    on_loadedmetadata() {
      this.currentTime = this.video.currentTime || 0;
      console.log('duration now', this.duration, this.video.duration);
      if (!this.duration) {
        this.duration = this.video.duration;
      }
      if (this.video.textTracks) {
        for (let i = 0; i < this.video.textTracks.length; i += 1) {
          const t = this.video.textTracks[i];
          if (t.kind === 'subtitles') {
            this.textTracks.push({
              idx: i,
              label: t.label,
            });
          }
        }
      }
      if (this.hls && this.hls.audioTracks) {
        for (let i = 0; i < this.hls.audioTracks.length; i += 1) {
          const t = this.hls.audioTracks[i];
          this.audioTracks.push({
            idx: i,
            label: t.name,
          });
        }
      }
    },

    load(src) {
      console.log('load method called', src);
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      this.video.src = null;
      this.autoplay = true;
      if (src.endsWith('.m3u8')) {
        console.log('creating new hls', this.video);
        this.hls = new Hls();
        this.hls.on(Hls.Events.MANIFEST_LOADED, () => this.on_manifestloaded());
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => { this.hls.loadSource(src); });
        this.hls.attachMedia(this.video);
      } else {
        console.log('plain video load', src);
        this.hls_loaded_metadata = true;
        this.video.load(src);
      }
    },

    // Event: play / pause / reload was clicked.
    on_play() {
      console.log('play() state is', this.playState);
      if (this.playState === 'ended') {
        this.video.currentTime = 0;
      }
      if (this.playState === 'playing') {
        this.video.pause();
      } else {
        this.video.play();
      }
    },

    on_seek(newTime) {
      if (this.playState === 'ended') {
        this.playState = 'paused';
      }
      this.video.currentTime = newTime;
    },

    on_texttrack(val) {
      console.log('texttrack', val);
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        this.video.textTracks[i].mode = 'disabled';
      }
      if (val !== null) {
        this.video.textTracks[val].mode = 'showing';
      }
      this.currentTextTrack = val;
    },

    on_audiotrack(val) {
      if (this.hls) {
        this.hls.audioTrack = val;
      }
      this.audioTrack = val;
    },

    on_volume(val) {
      console.log('volume changed to', val);
    },

    on_fullscreen() {
      if (this.quasar.fullscreen.isActive) {
        this.quasar.fullscreen.exit().then(() => { this.fullScreenState = 'off'; });
      } else {
        this.quasar.fullscreen.request().then(() => { this.fullScreenState = 'on'; });
      }
    },

    container_clicked() {
      if (this.playState !== 'ended') {
        this.on_play();
      }
    },

    // Called when the mouse is moved. Used to display the mouse
    // pointer and the video controls.
    mouse(showcontrols, ev) {
      console.log('mouse', this.showcontrols, showcontrols, this.playState);
      if (this.moved_timer) {
        clearTimeout(this.moved_timer);
        this.moved_timer = null;
      }
      if (showcontrols === 0 && ev) {
        if (ev.layerX >= 0 && ev.layerX < this.el.clientWidth
            && ev.layerY >= 0 && ev.layerY < this.el.clientHeight) {
          // spurious mouseleave event, because of teleported elements.. :(
          // eslint-disable-next-line
          console.log('bad mouseleave', ev);
          return;
        }
      }
      if (this.playState !== 'playing' && showcontrols < 2) {
        showcontrols = 2;
      }
      if (showcontrols === 1 && this.showcontrols < 2) {
        this.moved_timer = setTimeout(() => { this.showcontrols = 0; }, 2000);
      }
      this.showcontrols = showcontrols;
    },
  },
});
</script>
