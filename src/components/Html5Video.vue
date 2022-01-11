<template>
  <div
    class="html5video-container"
    :class="{ 'cursor-none': !showcontrols }"
    @touchend="container_clicked($event)"
    @mousedown.stop="false"
    @click="container_clicked()"
    @mousemove="mouse(1, $event)"
    @mouseleave="mouse(0, $event)"
    ref="el"
  >
    <video class="html5video-video" ref="video"></video>
    <q-slide-transition :duration="500">
      <div
        class="html5video-controls"
        v-if="showcontrols"
        @click.stop="true"
        @mousemove.stop="mouse(isTouch ? 1 : 3)"
        @touchstart.passive.capture="mouse(3)"
        @touchend.passive.capture="showcontrols = 1; mouse(1)"
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
           :airplayState="airplayState"
           :fullScreenState="fullScreenState"
           @play="on_play"
           @seek="on_seek"
           @volume="on_volume"
           @texttrack="on_texttrack"
           @audiotrack="on_audiotrack"
           @fullscreen="on_fullscreen"
           @menuActive="on_menuactive"
           @airplay="on_airplay"
        />
      </div>
    </q-slide-transition>
  </div>
</template>

<style>
.html5video-container {
  position: relative;
  background: black;
  width: 100%;
  height: 100%;
}
.html5video-video {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
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
    const quasar = useQuasar();
    // Only use native HLS on apple iphone/ipad, or safari browsers.
    const nativeHls = quasar.platfrom.is.ios || quasar.platform.is.safari;

    return {
      video: ref(null),
      playState: ref('playing'),
      volume: ref(0.5),
      currentTime: ref(0),
      duration: ref(null),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      castState: ref('no_devices'),
      airplayState: ref(false),
      fullScreenState: ref('off'),
      showcontrols: ref(2),
      moved_timer: null,
      el: ref(null),
      quasar,
      nativeHls,
      autoplay: true,
      isTouch: false,
    };
  },

  methods: {

    // Initialize.
    on_mounted() {
      // console.log('on_mounted');

      this.video.addEventListener('loadedmetadata', () => {
        this.metadata_loaded = true;
        if (this.hls_loaded_metadata) {
          this.on_loadedmetadata();
        }
      });
      this.video.addEventListener('play', () => { this.playState = 'playing'; if (this.showcontrols === 2) this.mouse(0); });
      this.video.addEventListener('pause', () => { this.playState = 'paused'; if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('ended', () => { this.playState = 'ended'; if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('timeupdate', () => { if (this.video) this.currentTime = this.video.currentTime; });
      this.video.addEventListener('volumechange', () => { this.volume = this.video.volume; });
      if (this.video.audioTracks && !this.hls) {
        this.video.audioTracks.addEventListener('addtrack', () => this.on_audiotracks_updated());
        this.video.audioTracks.addEventListener('removetrack', () => this.on_audiotracks_updated());
      }
      if (this.video.textTracks && !this.hls) {
        this.video.textTracks.addEventListener('addtrack', () => this.on_texttracks_updated());
        this.video.textTracks.addEventListener('removetrack', () => this.on_texttracks_updated());
        this.video.textTracks.addEventListener('change', () => this.on_texttrack_changed());
      }
      this.video.addEventListener('canplay', () => {
        if (this.autoplay) {
          this.video.play().catch(() => {
            // autoplay was prevented.
            this.playState = 'paused';
            this.autoplay = false;
            if (this.showcontrols < 2) {
              this.mouse(2);
            }
          });
        }
      });
      this.video.oncontextmenu = () => false;

      // Airplay support. For now, local to this component, not global as Chromecast.
      if (window.WebKitPlaybackTargetAvailabilityEvent) {
        this.video.addEventListener('webkitplaybacktargetavailabilitychanged', (ev) => {
          this.airplayAvailable = ev.availability === 'available';
        });

        // DEBUG.
        window.video = this.video;
      }

      watch(() => this.src, (newSrc, oldSrc) => {
        // console.log('watch -> load', this.src, newSrc, oldSrc);
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

    /*
    // This needs more thought.
    forced_subs() {
      if (this.audioTrack !== null && this.textTrack === null) {
        let audioTracks = this.hls ? this.hls.audioTracks : this.audioTracks;
        const lang = audioTracks[this.audioTrack].language;
        for (let i = 0; i < this.video.textTracks.length; i += 1) {
          const t = this.video.textTracks[i];
          if (t.language === lang && t.kind === 'forced') {
            this.on_texttrack(i);
            break;
          }
        }
      }
    },
    */

    on_loadedmetadata() {
      this.currentTime = this.video.currentTime || 0;
      // console.log('duration now', this.duration, this.video.duration);
      if (!this.duration) {
        this.duration = this.video.duration;
      }
      if (this.hls) {
        if (this.hls.audioTracks) {
          for (let i = 0; i < this.hls.audioTracks.length; i += 1) {
            const t = this.hls.audioTracks[i];
            this.audioTracks.push({
              id: i,
              label: t.name,
            });
          }
        }
        this.on_texttracks_updated();
      }
    },

    on_texttracks_updated() {
      this.textTracks = [];
      this.textTrack = null;
      if (!this.video.textTracks) {
        return;
      }

      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        const t = this.video.textTracks[i];
        if (t.kind === 'subtitles' || t.kind === 'captions' || t.kind === 'forced') {
          this.textTracks.push({
            id: i,
            label: t.label,
          });
        }
      }
      this.on_texttrack_changed();
    },

    on_texttrack_changed() {
      let activeTrack = null;
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        const t = this.video.textTracks[i];
        if (t.kind === 'subtitles' || t.kind === 'captions' || t.kind === 'forced') {
          if (t.mode === 'showing') {
            activeTrack = i;
            break;
          }
        }
      }
      if (this.textTrack === activeTrack) {
        return;
      }

      // Apple devices will often automatically choose captions
      // instead of subtitles. Try to fix that.
      if (activeTrack !== null && this.video.textTracks[activeTrack].kind === 'captions') {
        const at = this.video.textTracks[activeTrack];
        for (let i = 0; i < this.video.textTracks.length; i += 1) {
          const t = this.video.textTracks[i];
          if (t.language === at.language && t.kind === 'subtitles') {
            this.video.textTracks[activeTrack].mode = 'disabled';
            activeTrack = i;
            this.video.textTracks[activeTrack].mode = 'showing';
            break;
          }
        }
      }

      this.textTrack = activeTrack;
    },

    on_audiotracks_updated() {
      this.audioTracks = [];
      this.audioTrack = null;
      if (!this.video.audioTracks) {
        return;
      }
      for (let i = 0; i < this.video.audioTracks.length; i += 1) {
        const t = this.video.audioTracks[i];
        this.audioTracks.push({
          id: i,
          label: t.label,
        });
        if (t.enabled) {
          this.audioTrack = i;
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

      if (src.endsWith('.m3u8') && !this.nativeHls) {
        console.log('creating new hls', this.video);
        const hlsConfig = {
          backBufferLength: 0,
          maxMaxBufferLength: 120,
        };
        this.hls = new Hls(hlsConfig);
        this.hls.on(Hls.Events.MANIFEST_LOADED, () => this.on_manifestloaded());
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => { this.hls.loadSource(src); });
        this.hls.attachMedia(this.video);
      } else {
        console.log('plain video load', src);
        this.hls_loaded_metadata = true;
        this.video.src = src;
      }
    },

    // Event: play / pause / reload was clicked.
    on_play() {
      // console.log('play() state is', this.playState);
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
      // console.log('texttrack', val);
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        this.video.textTracks[i].mode = 'disabled';
      }
      if (val !== null) {
        this.video.textTracks[val].mode = 'showing';
      }
      this.currentTextTrack = val;
    },

    on_audiotrack(val) {
      this.audioTrack = val;

      if (this.hls) {
        this.hls.audioTrack = val;
        return;
      }

      if (this.video.audioTracks) {
        for (let i = 0; i < this.video.audioTracks.length; i += 1) {
          this.video.audioTracks[i].enabled = false;
        }
        if (val !== null) {
          this.video.audioTracks[val].enabled = true;
        }
      }
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

    on_menuactive(val) {
      // XXX FIXME doesn't work yet. QMenu events don't seem to fire.
      console.log(val);
      this.mouse(val ? 3 : 1);
    },

    on_airplay() {
      this.video.webkitShowPlaybackTargetPicker();
    },

    container_clicked(touchEvent) {
      console.log('container clicked');
      if (touchEvent) {
        this.isTouch = true;
      }
      if (this.showcontrols === 0) {
        this.mouse(1);
        if (touchEvent) {
          touchEvent.preventDefault();
        }
        return true;
      }
      if (this.playState !== 'ended' && !touchEvent) {
        this.on_play();
      }
      return true;
    },

    touch(showcontrols, ev) {
      this.mouse(showcontrols, ev);
      ev.preventDefault();
    },

    // Called when the mouse is moved. Used to display the mouse
    // pointer and the video controls.
    mouse(showcontrols, ev) {
      // console.log('mouse', this.showcontrols, showcontrols, this.playState);
      if (this.moved_timer) {
        clearTimeout(this.moved_timer);
        this.moved_timer = null;
      }
      if (showcontrols === 0 && ev) {
        if (ev.layerX >= 0 && ev.layerX < this.el.clientWidth
            && ev.layerY >= 0 && ev.layerY < this.el.clientHeight) {
          // spurious mouseleave event, because of teleported elements.. :(
          // eslint-disable-next-line
          // console.log('bad mouseleave', ev);
          return;
        }
      }
      if (this.playState !== 'playing' && showcontrols < 2) {
        showcontrols = 2;
      }
      if (showcontrols === 1 && this.showcontrols < 2) {
        this.moved_timer = setTimeout(() => { this.showcontrols = 0; }, 3000);
      }
      if (showcontrols === 0) {
        this.moved_timer = setTimeout(() => { this.showcontrols = 0; }, 1000);
      } else {
        this.showcontrols = showcontrols;
      }
    },
  },
});
</script>
