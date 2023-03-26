<template>
  <lrud>
  <div
    class="html5video-container"
    :class="{ 'cursor-none': !showControls && this.playState === 'playing' }"
    @touchend="mouseEvent(m.CLICK_CONTAINER, $event)"
    @click="mouseEvent(m.CLICK_CONTAINER, $event)"
    @mousemove="mouseEvent(m.MOVE_CONTAINER, $event)"
    @mouseleave="mouseEvent(m.LEAVE_CONTAINER, $event)"
    @keydown="onKeyDown"
    @keyup.f="onFullscreen()"
    @keyup.space="onPlay()"
    ref="el"
  >
    <div class="html5video-focus" tabindex="0" v-autofocus>&nbsp;</div>
    <video
      class="html5video-video"
      ref="video"
      disablepictureinpicture
      x-webkit-airplay="allow"
      crossorigin="anonymous"
    ></video>
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
          :airplayAvailable="airplayAvailable !== 0"
          :fullScreenState="fullScreenState"
          :stopButton="stopButton"
          @play="onPlay"
          @stop="onStop"
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
    <q-linear-progress
      color="blue-5"
      dark
      indeterminate
      class="html5video-progress"
      v-if="loading"
    />
  </div>
  </lrud>
</template>

<style lang="scss">
@import '~src/css/mixins.scss';
.html5video-container {
  display: flex;
  position: relative;
  background: black;
  outline: none;
  width: 100%;
  height: 100%;
}
.html5video-video {
  width: 100%;
  height: auto;
  max-height: 100%;
  margin: auto;
  display: block;
}
.html5video-video::cue {
  color: white;
  background: none;
  @include stroke();
}
.html5video-focus {
  position: fixed;
  width: 2em;
  height: 1em;
  outline: none;
}
.html5video-controls {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3) 85%, rgba(0,0,0,0) 100%);
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
.html5video-progress {
  left: 0;
  bottom: 0;
  position: fixed;
  z-index: 100;
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
  onBeforeUnmount,
  onUnmounted,
  onBeforeMount,
  onMounted,
  ref,
  toRefs,
  watch,
} from 'vue';
import { throttle, useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '../lib/api.js';
import VideoControls from 'components/VideoControls.vue';
import { ControlsEvent } from 'components/VideoControls.vue';
import shaka from 'shaka-player';

const MouseEvent = {
  CLICK_CONTAINER: 'click_container',
  MOVE_CONTAINER: 'move_container',
  LEAVE_CONTAINER: 'leave_container',
};
Object.freeze(MouseEvent);

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
  props: {
    'player-info': Object,
    'end-video-go-back': Boolean,
  },

  setup(props) {
    const loading = ref('true');
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const quasar = useQuasar();
    const api = useApi();

    let wasFullScreen = false;
    const video = ref(0);
    const { playerInfo } = toRefs(props);
    const currentVideo = playerInfo;
    console.log('Html5Video: currentVideo:', currentVideo);

    onBeforeMount(() => {
      const instance = getCurrentInstance();
      if (instance.ctx.currentVideo !== null) {
        instance.ctx.setDisplayState(DisplayState.TMPSHOW, 4000);
      }
    });

    onMounted(() => {
      // Might happen after a reload.
      const instance = getCurrentInstance();
      // if (instance.ctx.currentVideo === null) {
      //   router.go(-1);
      //   return;
      // }
      instance.ctx.mounted();
      wasFullScreen = quasar.fullscreen.isActive;
    });

    onBeforeUnmount(() => {
      const instance = getCurrentInstance();
      if (video.value) {
        video.value.pause();
      }
      if (instance.ctx.shaka) {
        instance.ctx.shaka.unload();
      } else if (video.value) {
        if (video.value.srcObject) {
          video.value.srcObject = null;
        }
        if (video.value.src) {
          video.value.removeAttribute('src');
          video.value.load();
        }
      }
      if (window.video) {
        window.video = null;
      }
    });

    onUnmounted(() => {
      // console.log('unmounted');

      // leave full screen.
      if (!wasFullScreen && quasar.fullscreen.isActive) {
        quasar.fullscreen.exit();
      }
    });

    // On iOS, or macos with the Safari browser, use native hls.
    const isSafari = () => (quasar.platform.is.ios || quasar.platform.is.safari);
    const nativeHls = isSafari();

    // With Safari 15.4 on iOS, in PWA mode the webkitplaybacktargetavailabilitychanged
    // event (almost?) always reports 'not-available', while it _is_. So in that case
    // just alwatys show the airplay button.
    const airplayAvailable = ref((quasar.platform.is.ios && window.navigator.standalone) ? 2 : 0);

    const fullScreenState = ref(quasar.fullscreen.isCapable && !quasar.platform.is.tv
      ? (quasar.fullscreen.isActive ? 'yes' : 'no') : null);
    const stopButton = ref(quasar.fullscreen.isActive);

    return {
      api,
      video,
      playState: ref('paused'),
      volume: ref(1),
      muted: ref(false),
      currentTime: ref(0),
      currentVideo,
      duration: ref(null),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      castState: ref('no_devices'),
      airplayAvailable,
      fullScreenState,
      stopButton,
      showControls: ref(false),
      displayState: ref(DisplayState.HIDDEN),
      displayTimer: null,
      info: ref(null),
      loading,
      nativeHls,
      bigPlayButton: ref(false),
      ignoreMouse: false,
      wantAutoPlay: true,
      isSafari,
      quasar,
      controlsEl: ref(null),
      el: ref(null),
      m: MouseEvent,
      route,
      router,
    };
  },

  methods: {

    // Initialize.
    mounted() {
      this.el.focus();

      // Copy existing global state (from the OS).
      this.muted = this.video.muted;
      this.volume = this.video.volume;

      // We need to set 'autoplay' on iOS, otherwise nothing works (!)
      if (this.$q.platform.is.ios) {
        this.video.setAttribute("autoplay", "");
      }

      if (this.isSafari()) {
        if (!store.state.config.iosNativeVideo) {
          // Need to set this, otherwise the native player starts on iPhone.
          this.video.setAttribute("playsinline", "");
        }
      }

      this.video.addEventListener('loadedmetadata', () => {
        // console.log('loaded metadata event');
        this.loaded_metadata = true;
        this.onLoadedmetadata();
      });
      this.video.addEventListener('play', () => { this.setState('playing'); });
      this.video.addEventListener('pause', () => { this.setState('paused'); });
      this.video.addEventListener('ended', () => { 
        this.setState('ended');
        if (this.endVideoGoBack) {
          window.history.back();
        }
      });
      const updateStoreVideoCurrentTime = throttle((() => {
        const newRoute = {
          path: this.route.path,
          query: { t: Math.floor(this.video.currentTime) },
        };
        this.router.replace(newRoute);
        this.api
          .updateSeen(this.currentVideo, this.video.currentTime, this.video.duration)
          .catch((e) => console.log('failed to updateSeen: ', e));
      }).bind(this), 5000);
      this.video.addEventListener('timeupdate', () => {
        if (this.video) {
          this.currentTime = this.video.currentTime;
          updateStoreVideoCurrentTime();
        }
      });
      this.video.addEventListener('volumechange', () => {
        this.volume = this.video.volume;
        this.muted = this.video.muted;
      });
      if (this.video.audioTracks && !this.shaka) {
        this.video.audioTracks.addEventListener('addtrack', () => this.onAudiotracks_updated());
        this.video.audioTracks.addEventListener('removetrack', () => this.onAudiotracks_updated());
      }
      if (this.video.textTracks && !this.shaka) {
        this.video.textTracks.addEventListener('addtrack', () => this.onTexttracks_updated());
        this.video.textTracks.addEventListener('removetrack', () => this.onTexttracks_updated());
        this.video.textTracks.addEventListener('change', () => this.onTexttrack_changed());
      }

      let autoplay_ev = this.isSafari() ? 'loadedmetadata' : 'canplay';
      this.video.addEventListener(autoplay_ev, () => {
        this.loading = false;
        this.autoplay();
      });

      this.video.addEventListener('abort', () => this.onError());
      this.video.addEventListener('error', () => this.onError());
      this.video.oncontextmenu = () => false;

      // Airplay support. For now, local to this component, not global as Chromecast.
      if (window.WebKitPlaybackTargetAvailabilityEvent) {
        this.video.addEventListener('webkitplaybacktargetavailabilitychanged', (ev) => {
          console.log('Html5Video: airplay availaility: ', ev.availability);
          if (this.airplayAvailable < 2) {
            const airPlaying = this.video.webkitCurrentPlaybackTargetIsWireless;
            const isAvailable = ev.availability === 'available';
            this.airplayAvailable = (airPlaying || isAvailable) ? 1 : 0;
          }
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

    setState(state) {
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
          // console.log('Html5Video: autoplay prevented');
          this.setState('paused');
          this.bigPlayButton = true;
          this.info = info;
          if (this.showcontrols < 2) {
            this.mouse(2);
          }
        },
      );
    },

    overlay() {
      return this.bigPlayButton || (this.info && this.playState === 'paused');
    },

    onLoadedmetadata() {
      if (!this.loaded_metadata) {
        return;
      }
      if (this.currentVideo.currentTime) {
        this.video.currentTime = this.currentVideo.currentTime;
        this.currentTime = this.currentVideo.currentTime;
      } else {
        this.currentTime = this.video.currentTime || 0;
      }
      // console.log('Html5Video: duration now', this.duration, this.video.duration);
      if (!this.duration) {
        this.duration = this.video.duration;
      }
      if (this.shaka) {
        // Initialize audio tracks.
        const audioLanguages = this.shaka.getAudioLanguages();
        if (audioLanguages && audioLanguages.length > 1) {
          for (let i = 0; i < audioLanguages.length; i += 1) {
            this.audioTracks.push({
              id: i,
              label: audioLanguages[i],
            });
          }
        }
        // Initialize text tracks.
        this.onTexttracks_updated();
      }
    },

    getTextTracks() {
      if (this.shaka) {
        return this.shaka.getTextTracks();
      }
      return this.video ? this.video.textTracks : null;
    },

    onTexttracks_updated() {
      this.textTracks = [];
      this.textTrack = null;

      const textTracks = this.getTextTracks();
      for (let i = 0; i < textTracks.length; i += 1) {
        const t = textTracks[i];
        if (!t.label && !t.language) {
          continue;
        }
        if (t.kind === 'subtitles' || t.kind === 'subtitle' ||
            t.kind === 'captions' || t.kind === 'forced') {
          this.textTracks.push({
            id: i,
            label: t.label,
          });
        }
      }
      this.onTexttrack_changed();
    },

    onTexttrack_changed() {
      const textTracks = this.getTextTracks();
      if (!textTracks) {
        this.textTracks = [];
        this.textTrack = null;
        retrn;
      }
      let activeTrack = null;
      for (let i = 0; i < textTracks.length; i += 1) {
        const t = textTracks[i];
        if (t.kind === 'subtitles' || t.kind === 'captions' || t.kind === 'forced') {
          if (!t.label && !t.language) {
            continue;
          }
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
      if (activeTrack !== null && textTracks[activeTrack].kind === 'captions') {
        const at = textTracks[activeTrack];
        for (let i = 0; i < textTracks.length; i += 1) {
          const t = textTracks[i];
          if (t.language === at.language && t.kind === 'subtitles') {
            textTracks[activeTrack].mode = 'disabled';
            activeTrack = i;
            textTracks[activeTrack].mode = 'showing';
            break;
          }
        }
      }

      this.textTrack = activeTrack;
    },

    onAudiotracks_updated() {
      this.audioTracks = [];
      this.audioTrack = null;
      if (!this.video || !this.video.audioTracks) {
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

    initShaka() {
      // if (this.shaka) {
      //   this.shaka.unload();
      // }
      if (!this.shaka) {
        console.log('Html5Video: initializing shaka...');
        this.shaka = new shaka.Player(this.$refs.video);
        window.player = this.shaka;
        this.shaka.configure({
          preferredAudioChannelCount: 6,
          abr: {
            enabled: false,
          },
        });
        console.log('Html5Video: done!');
      }
    },

    load(item) {
      console.log('Html5Video: load method called', item);
      if (this.video.src) {
        this.video.removeAttribute('src');
      }

      // We need an absolute URL (for airplay).
      const url = new URL(item.src, window.location.origin).href;

      if (url.endsWith('.m3u8') && !this.nativeHls) {
        this.initShaka();
        console.log('Html5Video: shaka.load', url);
        this.shaka.load(url);
      } else {
        // console.log('Html5Video: plain video load', url);
        this.video.src = url;
      }
    },

    // Event: play / pause / reload was clicked.
    onPlay() {
      console.log('Html5Video: play() state is', this.playState);
      if (this.playState === 'ended') {
        this.video.currentTime = 0;
      }
      if (this.playState === 'playing') {
        console.log('Html5Video: calling pause');
        this.video.pause();
      } else {
        console.log('Html5Video: calling play');
        this.video.play();
      }
      this.bigPlayButton = false;
    },

    // Stop button (if shown) was clicked.
    onStop() {
      this.$router.go(-1);
    },

    onSeek(newTime, fast) {
      if (this.playState === 'ended') {
        this.setState('paused');
      }
      if (fast && this.video.fastSeek && !this.shaka) {
        // console.log('Html5Video: onSeek: fastSeek to', newTime);
        this.video.fastSeek(newTime);
      } else {
        // console.log('Html5Video: onSeek: updating currentTime to', newTime);
        this.video.currentTime = newTime;
      }
      this.currentTime = newTime;
    },

    onTexttrack(val) {
      console.log('Html5Video: onTexttrack', val);
      const textTracks = this.getTextTracks();
      if (this.shaka) {
        if (val !== null && val >= 0) {
          this.shaka.selectTextTrack(textTracks[val]);
        }
        this.shaka.setTextTrackVisibility(val !== null && val >= 0);
      } else {
        for (let i = 0; i < textTracks.length; i += 1) {
          textTracks[i].mode = (i === val) ? 'showing' : 'disabled';
        }
      }
      this.currentTextTrack = val;
    },

    onAudiotrack(val) {
      this.audioTrack = val;

      if (this.shaka) {
        this.shaka.selectAudioLanguage(this.audioTracks[val].label);
      } else {
        if (this.video.audioTracks) {
          for (let i = 0; i < this.video.audioTracks.length; i += 1) {
            this.video.audioTracks[i].enabled = (i === val);
          }
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
      if (this.fullScreenState === null) {
        return;
      }
      if (this.quasar.fullscreen.isActive) {
        this.quasar.fullscreen.exit().then(() => {
          this.fullScreenState = 'off';
          this.stopButton = false;
        });
      } else {
        this.quasar.fullscreen.request(this.el).then(() => {
          this.fullScreenState = 'on';
          this.stopButton = true;
        });
      }
    },

    onAirplay() {
      this.video.webkitShowPlaybackTargetPicker();
    },

    relSeek(offset) {
      // console.log('Html5Video: relseek', offset);
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
      this.onSeek(newTime, true);
      // console.log('Html5Video: seek from', this.video.currentTime, 'to', newTime);
    },

    onKeyDown(ev) {
      switch (ev.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          if (this.displayState === DisplayState.HIDDEN) {
            this.onControlsActive(ControlsEvent.TMPACTIVE);
          }
          break;
        case 'Escape':
          ev.stopPropagation();
          ev.preventDefault();
          this.$router.go(-1);
          break;
      }
    },

    setDisplayState(state, timeout) {
      // Clear timer.
      if (this.displayTimer) {
        clearTimeout(this.displayTimer);
        this.displayTimer = null;
      }
      // console.log('Html5Video: setDisplayState', state, timeout);

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

    onControlsActive(event) {
      this.handleEvent(event);
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
      // console.log('Html5Video: mouseEvent', ev, nativeEv);
      if (!document.hasFocus() && ev !== MouseEvent.LEAVE_CONTAINER) {
        return;
      }
      this.handleEvent(ev, nativeEv);
    },

    handleEvent(ev) {
      // console.log('Html5Video: handleEvent', ev);
      this.handleEvent2(ev);
      // console.log('Html5Video:   --> displayState:', this.displayState);
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

      if (ev === ControlsEvent.TMPACTIVE) {
        this.setDisplayState(DisplayState.TMPSHOW, 4000);
      }

      if (ev === ControlsEvent.IDLE || ev === ControlsEvent.OFF) {
        // console.log('Html5Video: ControlsEvent.IDLE', canHide);
        if (canHide) {
          const tmout = ev === ControlsEvent.IDLE ? 3000 : 500;
          this.setDisplayState(DisplayState.HIDDEN, tmout);
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
