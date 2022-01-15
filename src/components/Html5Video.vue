<template>
  <div
    class="html5video-container"
    tabindex="0"
    :class="{ 'cursor-none': !showControls && this.playState === 'playing' }"
    @touchend="mouseEvent(m.CLICK_CONTAINER, $event)"
    @click="mouseEvent(m.CLICK_CONTAINER, $event)"
    @mousemove="mouseEvent(m.MOVE_CONTAINER, $event)"
    @mouseleave="mouseEvent(m.LEAVE_CONTAINER, $event)"
    @keyup.f="onFullscreen()"
    @keyup.space="onPlay()"
    @keyup.left="relSeek(-15)"
    @keyup.right="relSeek(15)"
    ref="el"
  >
    <video class="html5video-video" ref="video"></video>
    <div class="html5video-overlay column fit" v-if="overlay()">
      <div class="row justify-center items-center fit absolute">
        <div v-if="bigPlayButton" class="col-auto">
          <q-icon name="play_circle_outline" class="hover-pointer" size="128px" @click="onPlay()" />
        </div>
      </div>
      <q-card flat class="html5video-info q-ml-lg row" v-if="info">
        <q-card-section>
          <div v-if="info.line1" class="scaled-text-h2 html5video-txt">{{ info.line1 }}</div>
          <div v-if="info.line2" class="scaled-text-h5 html5video-txt">{{ info.line2 }}</div>
          <div v-if="info.line3" class="scaled-text-h4 html5video-txt">{{ info.line3 }}</div>
        </q-card-section>
      </q-card>
    </div>
    <q-slide-transition :duration="500">
      <div class="html5video-controls" v-if="showControls" ref="controlsEl">
        <VideoControls
           :playState="playState"
           :volume="volume"
           :muted="muted"
           :currentTime="currentTime"
           :duration="duration"
           :textTrack="textTrack"
           :textTracks="textTracks"
           :audioTrack="audioTrack"
           :audioTracks="audioTracks"
           :castState="castState"
           :airplayState="airplayState"
           :fullScreenState="fullScreenState"
           @play="onPlay"
           @seek="onSeek"
           @volume="onVolume"
           @mute="onMute"
           @texttrack="onTexttrack"
           @audiotrack="onAudiotrack"
           @fullscreen="onFullscreen"
           @airplay="onAirplay"
           @keyup.prevent="true"
           @controlsActive="onControlsActive"
        />
      </div>
    </q-slide-transition>
  </div>
</template>

<style lang="scss">
@import '~src/css/mixins.scss';
.html5video-container {
  position: relative;
  background: black;
  outline: none;
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
.html5video-video::cue {
  color: white;
  background: none;
  @include stroke();
}
.html5video-controls {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%);
  color: white;
}
.html5video-overlay {
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
}
.html5video-info {
  position: absolute;
  left: 0px;
  bottom: 60px;
  background: none;
  @include stroke();
  font-weight: 700;
  max-width: max(320px, 55%);
}
.html5video-txt {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scaled-text-h2 {
  font-size: clamp(1.5rem, 0.6196rem + 3.9130vw, 3.75rem);
  line-height: clamp(1.5rem, 0.6196rem + 3.9130vw, 3.75rem);
  font-weight: 300;
  white-space: normal;
  @include stroke();
  // line-height: 3.75rem;
  // letter-spacing: -0.00833em;
}
.scaled-text-h4 {
  font-size: clamp(1.2rem, 0.8380rem + 1.6087vw, 2.125rem);
  font-weight: 400;
  @include stroke();
  // line-height: 2.5rem;
  // letter-spacing: 0.00735em;
}
.scaled-text-h5 {
  font-size: clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem);
  font-weight: 400;
  @include stroke();
  // line-height: 2rem;
  // letter-spacing: normal;
}
</style>

<script>
/* eslint no-console: "off" */
import {
  defineComponent,
  getCurrentInstance,
  onUnmounted,
  onBeforeMount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import VideoControls from 'components/VideoControls.vue';
import Hls from 'hls.js';

const MouseEvent = {
  CLICK_CONTAINER: 'click_container',
  MOVE_CONTAINER: 'move_container',
  LEAVE_CONTAINER: 'leave_container',
};
Object.freeze(MouseEvent);

const ControlsEvent = {
  IDLE: 'controls_idle',
  ACTIVE: 'controls_active',
};
Object.freeze(ControlsEvent);

const PlayEvent = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  ENDED: 'ended',
};
Object.freeze(PlayEvent);

const DisplayState = {
  HIDDEN: 0,
  TMPSHOW: 1,
  PAUSED: 2,
  CONTROLSACTIVE: 3,
};
Object.freeze(DisplayState);

export default defineComponent({
  name: 'Html5Video',
  components: {
    VideoControls,
  },

  setup() {
    const router = useRouter();

    onBeforeMount(() => {
      const instance = getCurrentInstance();
      if (instance.ctx.currentVideo !== null) {
        instance.ctx.setDisplayState(DisplayState.TMPSHOW, 4000);
      }
    });

    onMounted(() => {
      // Might happen after a reload.
      const instance = getCurrentInstance();
      if (instance.ctx.currentVideo === null) {
        router.go(-1);
      }
      instance.ctx.mounted();
    });

    onUnmounted(() => {
      // make sure we get rid of the video.
      if (window.video) {
        window.video = null;
      }
      const instance = getCurrentInstance();
      if (instance.ctx.hls) {
        instance.ctx.hls.destroy();
      }
      if (instance.ctx.video) {
        instance.ctx.video = '';
        instance.video.load();
        instance.video = null;
      }
    });
    const quasar = useQuasar();
    const isSafari = () => (quasar.platform.is.ios || quasar.platform.is.safari);

    // Only use native HLS on apple iphone/ipad, or safari browsers.
    const nativeHls = isSafari();

    const store = useStore();
    return {
      video: ref(null),
      playState: ref('paused'),
      volume: ref(1),
      muted: ref(false),
      currentTime: ref(0),
      duration: ref(null),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      castState: ref('no_devices'),
      airplayState: ref(false),
      fullScreenState: ref('off'),
      seeking: false,
      showControls: ref(false),
      displayState: ref(DisplayState.HIDDEN),
      displayTimer: null,
      denderTimer: null,
      info: ref(null),
      nativeHls,
      bigPlayButton: ref(false),
      currentVideo: ref(store.state.currentVideo),
      ignoreMouse: false,
      wantAutoPlay: true,
      isSafari,
      quasar,
      controlsEl: ref(null),
      el: ref(null),
      m: MouseEvent,
    };
  },

  methods: {

    // Initialize.
    mounted() {
      this.el.focus();

      // Copy existing global state (from the OS).
      this.muted = this.video.muted;
      this.volume = this.video.volume;

      this.video.addEventListener('loadedmetadata', () => {
        this.metadata_loaded = true;
        if (this.hls_loaded_metadata) {
          this.onLoadedmetadata();
          // console.log('loaded metadata');
          if (this.isSafari()) {
            this.autoplay();
          }
        }
      });
      this.video.addEventListener('play', () => { this.setState('playing'); });
      this.video.addEventListener('pause', () => { this.setState('paused'); });
      this.video.addEventListener('ended', () => { this.setState('ended'); });
      this.video.addEventListener('seeking', () => { this.seeking = true; });
      this.video.addEventListener('seeked', () => { this.seeking = false; });
      this.video.addEventListener('timeupdate', () => {
        // console.log('timeupdate, seeking is', this.seeking);
        if (this.video && (!this.seeking || this.playState !== 'playing')) {
          this.currentTime = this.video.currentTime;
        }
      });
      this.video.addEventListener('volumechange', () => {
        this.volume = this.video.volume;
        this.muted = this.video.muted;
      });
      if (this.video.audioTracks && !this.hls) {
        this.video.audioTracks.addEventListener('addtrack', () => this.onAudiotracks_updated());
        this.video.audioTracks.addEventListener('removetrack', () => this.onAudiotracks_updated());
      }
      if (this.video.textTracks && !this.hls) {
        this.video.textTracks.addEventListener('addtrack', () => this.onTexttracks_updated());
        this.video.textTracks.addEventListener('removetrack', () => this.onTexttracks_updated());
        this.video.textTracks.addEventListener('change', () => this.onTexttrack_changed());
      }
      this.video.addEventListener('canplay', () => { if (!this.isSafari()) { this.autoplay(); } });
      this.video.addEventListener('abort', () => this.onError());
      this.video.addEventListener('error', () => this.onError());
      this.video.oncontextmenu = () => false;

      // Airplay support. For now, local to this component, not global as Chromecast.
      if (window.WebKitPlaybackTargetAvailabilityEvent) {
        this.video.addEventListener('webkitplaybacktargetavailabilitychanged', (ev) => {
          this.airplayAvailable = ev.availability === 'available';
        });
      }

      watch(() => this.currentVideo, (newVideo, oldVideo) => {
        if (newVideo && (!oldVideo || newVideo.src !== oldVideo.src)) {
          this.load(newVideo);
        }
      });
      if (this.currentVideo && this.currentVideo.src) {
        this.load(this.currentVideo);
      }

      // Debug.
      window.video = this.video;
    },

    debounce(func) {
      if (this.chillin) {
        return;
      }
      this.chillin = true;
      setTimeout(() => { this.chillin = false; }, 2);
      func();
    },

    setState(state) {
      this.seeking = false;
      this.playState = state;
      this.handleEvent(state);
    },

    onError() {
      if (this.video) {
        this.video.pause();
        this.setState('pause');
      }
    },

    autoplay() {
      // Only do this once. Otherwise, other 'canplay' events
      // will suddenly start the video.
      if (!this.wantAutoPlay) {
        return;
      }
      this.wantAutoPlay = false;

      const info = {};
      if (this.currentVideo.type === 'movie') {
        info.line1 = this.currentVideo.title;
        info.line2 = this.currentVideo.year;
      }

      if (this.currentVideo.type === 'episode') {
        const { season } = this.currentVideo;
        const { episode } = this.currentVideo;
        info.line1 = this.currentVideo.title;
        info.line2 = `Season ${season}, Episode ${episode}`;
        info.line3 = this.currentVideo.seriesTitle;
      }

      this.video.play().then(
        () => { this.info = info; },
        () => {
          // autoplay was prevented.
          // console.log('autoplay prevented');
          this.setState('paused');
          this.bigPlayButton = true;
          if (this.showcontrols < 2) {
            this.mouse(2);
          }
        },
      );
    },

    overlay() {
      return this.bigPlayButton || (this.info && this.playState === 'paused');
    },

    onManifestloaded() {
      this.hls_loaded_metadata = true;
      if (this.metadata_loaded) {
        this.onLoadedmetadata();
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
            this.onTexttrack(i);
            break;
          }
        }
      }
    },
    */

    onLoadedmetadata() {
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
        this.onTexttracks_updated();
      }
    },

    onTexttracks_updated() {
      this.textTracks = [];
      this.textTrack = null;
      if (!this.video || !this.video.textTracks) {
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
      this.onTexttrack_changed();
    },

    onTexttrack_changed() {
      if (!this.video || !this.video.textTracks) {
        this.textTracks = [];
        this.textTrack = null;
        return;
      }
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

    onAudiotracks_updated() {
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

    load(item) {
      console.log('Html5Video: load method called', item);
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      this.video.src = null;

      // We need an absolute URL (for airplay).
      const url = new URL(item.src, window.location.origin).href;

      if (url.endsWith('.m3u8') && !this.nativeHls) {
        // console.log('creating new hls', this.video);
        const hlsConfig = {
          backBufferLength: 0,
          maxMaxBufferLength: 120,
        };
        this.hls = new Hls(hlsConfig);
        this.hls.on(Hls.Events.MANIFEST_LOADED, () => this.onManifestloaded());
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => { this.hls.loadSource(url); });
        this.hls.attachMedia(this.video);
      } else {
        // console.log('plain video load', url);
        this.hls_loaded_metadata = true;
        this.video.src = url;
      }
    },

    // Event: play / pause / reload was clicked.
    onPlay() {
      // console.log('play() state is', this.playState);
      if (this.playState === 'ended') {
        this.video.currentTime = 0;
      }
      if (this.playState === 'playing') {
        // console.log('calling pause');
        this.video.pause();
      } else {
        // console.log('calling play');
        this.video.play();
      }
      this.bigPlayButton = false;
    },

    onSeek(newTime, fast) {
      if (this.playState === 'ended') {
        this.setState('paused');
      }
      if (this.playState === 'playing') {
        this.seeking = true;
      }
      if (fast && this.video.fastSeek && !this.hls) {
        // console.log('onSeek: fastSeek to', newTime);
        this.video.fastSeek(newTime);
      } else {
        // console.log('onSeek: updating currentTime to', newTime);
        this.video.currentTime = newTime;
      }
    },

    onTexttrack(val) {
      // console.log('texttrack', val);
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        this.video.textTracks[i].mode = 'disabled';
      }
      if (val !== null) {
        this.video.textTracks[val].mode = 'showing';
      }
      this.currentTextTrack = val;
    },

    onAudiotrack(val) {
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

    onVolume() {
      if (!this.video) return;
      console.log('Html5Video: onVolume: TODO');
    },

    onMute() {
      if (!this.video) return;
      this.video.muted = !this.video.muted;
    },

    onFullscreen() {
      if (this.quasar.fullscreen.isActive) {
        this.quasar.fullscreen.exit().then(() => { this.fullScreenState = 'off'; });
      } else {
        this.quasar.fullscreen.request(this.el).then(() => { this.fullScreenState = 'on'; });
      }
    },

    onAirplay() {
      this.video.webkitShowPlaybackTargetPicker();
    },

    relSeek(offset) {
      // console.log('relseek', offset);
      if (!this.duration) {
        return;
      }
      let newTime = this.video.currentTime + offset;
      if (newTime < 0) {
        newTime = 0;
      }
      if (newTime > this.duration) {
        newTime = this.duration;
      }
      this.onSeek(newTime);
      // console.log('seek from', this.video.currentTime, 'to', newTime);
    },

    setDisplayState(state, timeout) {
      // Clear timer.
      if (this.displayTimer) {
        clearTimeout(this.displayTimer);
        this.displayTimer = null;
      }
      // console.log('setDisplayState', state, timeout);

      if (state === DisplayState.HIDDEN) {
        if (this.displayState !== DisplayState.HIDDEN) {
          this.displayState = DisplayState.TMPSHOW;
        }
        this.displayTimer = setTimeout(() => {
          this.displayState = DisplayState.HIDDEN;
          this.showControls = false;
        }, timeout);
        return;
      }

      if (state === DisplayState.TMPSHOW) {
        this.showControls = true;
        this.displayState = DisplayState.TMPSHOW;
        this.displayTimer = setTimeout(() => {
          this.displayState = DisplayState.HIDDEN;
          this.showControls = false;
        }, timeout);
        return;
      }

      this.showControls = true;
      this.displayState = state;
    },

    onControlsActive(active) {
      this.handleEvent(active ? ControlsEvent.ACTIVE : ControlsEvent.IDLE);
    },

    fromControls(ev) {
      if (ev.touches && this.displayState === DisplayState.CONTROLSACTIVE) {
        return true;
      }
      let ret = false;
      Object.values(ev.composedPath()).forEach((e) => {
        if (e === this.controlsEl) {
          ret = true;
        }
      });
      return ret;
    },

    mouseEvent(ev, nativeEv) {
      if (nativeEv.touches) {
        this.isTouch = true;
      }
      if (this.isTouch && !nativeEv.touches) {
        return;
      }
      if (this.fromControls(nativeEv)) {
        return;
      }
      // console.log('mouseEvent', ev, nativeEv);
      if (!document.hasFocus() && ev !== MouseEvent.LEAVE_CONTAINER) {
        return;
      }
      this.handleEvent(ev, nativeEv);
    },

    handleEvent(ev) {
      // console.log('handleEvent', ev);
      this.handleEvent2(ev);
      // console.log('  --> displayState:', this.displayState);
    },

    handleEvent2(ev) {
      // Clear timer.
      if (this.displayTimer) {
        clearTimeout(this.displayTimer);
        this.displayTimer = null;
      }

      const canHide = this.displayState < DisplayState.PAUSED
                      || this.playState === 'playing';

      if (ev === ControlsEvent.ACTIVE) {
        this.setDisplayState(DisplayState.CONTROLSACTIVE);
      }

      if (ev === ControlsEvent.IDLE) {
        // console.log('ControlsEvent.IDLE');
        if (canHide) {
          this.setDisplayState(DisplayState.HIDDEN, 3000);
        } else if (this.playState === 'paused' && this.isTouch) {
          this.setDisplayState(DisplayState.PAUSED);
        }
      }

      if (ev === MouseEvent.CLICK_CONTAINER) {
        this.el.focus();
        if (this.isTouch && this.displayState === DisplayState.HIDDEN) {
          this.setDisplayState(DisplayState.TMPSHOW, 3000);
          return;
        }
        if (this.displayState === DisplayState.TMPSHOW) {
          this.setDisplayState(DisplayState.TMPSHOW, 3000);
        }
        this.onPlay();
      }

      if (ev === PlayEvent.PAUSED) {
        if (this.displayState < DisplayState.PAUSED) {
          this.setDisplayState(DisplayState.PAUSED);
        }
      }

      if (ev === PlayEvent.PLAYING) {
        if (this.displayState !== DisplayState.HIDDEN) {
          this.setDisplayState(DisplayState.HIDDEN, 3000);
        }
      }

      if (this.displayState === DisplayState.CONTROLSACTIVE) {
        return;
      }

      if (ev === MouseEvent.MOVE_CONTAINER && canHide) {
        this.setDisplayState(DisplayState.TMPSHOW, 3000);
      }

      if (ev === MouseEvent.LEAVE_CONTAINER && canHide) {
        this.setDisplayState(DisplayState.HIDDEN, 3000);
      }
    },
  },
});
</script>
