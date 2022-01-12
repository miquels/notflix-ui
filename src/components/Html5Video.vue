<template>
  <div
    class="html5video-container"
    tabindex="0"
    :class="{ 'cursor-none': !showcontrols }"
    @touchend="container_clicked($event)"
    @mousedown.stop="false"
    @click="container_clicked()"
    @mousemove="mouse(1, $event)"
    @mouseleave="mouse(0, $event)"
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
          <div v-if="info.line1" class="text-h2 html5video-txt">{{ info.line1 }}</div>
          <div v-if="info.line2" class="text-h5 html5video-txt">{{ info.line2 }}</div>
          <div v-if="info.line3" class="text-h4 html5video-txt">{{ info.line3 }}</div>
        </q-card-section>
      </q-card>
    </div>
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
           @play="onPlay"
           @seek="onSeek"
           @volume="onVolume"
           @texttrack="onTexttrack"
           @audiotrack="onAudiotrack"
           @fullscreen="onFullscreen"
           @menuActive="onMenactive"
           @airplay="onAirplay"
           @keyUp.prevent="true"
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
  text-shadow: none;
  @include stroke(2px, black);
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
  // z-index: 1;
}
.html5video-info {
  position: absolute;
  left: 10px;
  bottom: 60px;
  // z-index: 1;
  background: none;
  @include stroke(2px, black);
  font-weight: 700;
}
.html5video-txt {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
/* eslint no-console: "off" */
import {
  defineComponent,
  getCurrentInstance,
  onUnmounted,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import VideoControls from 'components/VideoControls.vue';
import Hls from 'hls.js';

export default defineComponent({
  name: 'Html5Video',
  components: {
    VideoControls,
  },

  setup() {
    const router = useRouter();
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
      seeking: false,
      showcontrols: ref(0),
      moved_timer: null,
      info: ref(null),
      nativeHls,
      bigPlayButton: ref(false),
      currentVideo: ref(store.state.currentVideo),
      ignoreClick: false,
      wantAutoPlay: true,
      isTouch: false,
      isSafari,
      el: ref(null),
    };
  },

  methods: {

    // Initialize.
    mounted() {
      // console.log('mounted');
      window.dbg = this;

      this.$el.focus();

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
      this.video.addEventListener('play', () => { this.setState('playing'); if (this.showcontrols === 2) this.mouse(0); });
      this.video.addEventListener('pause', () => { this.setState('paused'); if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('ended', () => { this.setState('ended'); if (this.showcontrols < 2) this.mouse(2); });
      this.video.addEventListener('seeking', () => { this.seeking = true; });
      this.video.addEventListener('seeked', () => { this.seeking = false; });
      this.video.addEventListener('timeupdate', () => {
        // console.log('timeupdate, seeking is', this.seeking);
        setTimeout(() => {
          if (this.video && !this.seeking) {
            this.currentTime = this.video.currentTime;
          }
        }, 10);
      });
      this.video.addEventListener('volumechange', () => { this.volume = this.video.volume; });
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

    setState(state) {
      this.seeking = false;
      this.playState = state;
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
      this.video.play().then(
        () => {
          const { season } = this.currentVideo;
          const { episode } = this.currentVideo;
          this.info = {};
          this.info.line1 = this.currentVideo.title;
          this.info.line2 = `Season ${season}, Episode ${episode}`;
          this.info.line3 = this.currentVideo.seriesTitle;
        },
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

    onVolume(val) {
      console.log('volume changed to', val);
    },

    onFullscreen() {
      if (this.quasar.fullscreen.isActive) {
        this.quasar.fullscreen.exit().then(() => { this.fullScreenState = 'off'; });
      } else {
        this.quasar.fullscreen.request().then(() => { this.fullScreenState = 'on'; });
      }
    },

    onMenactive(val) {
      // XXX FIXME doesn't work yet. QMenu events don't seem to fire.
      console.log(val);
      this.mouse(val ? 3 : 1);
    },

    onAirplay() {
      this.video.webkitShowPlaybackTargetPicker();
    },

    container_clicked(touchEvent) {
      this.el.focus();
      if (this.ignoreClick) {
        return;
      }
      // console.log('container clicked', touchEvent);
      if (touchEvent) {
        this.ignoreClick = true;
        setTimeout(() => { this.ignoreClick = false; }, 10);
        this.isTouch = true;
        if (this.showcontrols === 0) {
          this.mouse(1);
          return;
        }
      }
      if (this.playState !== 'ended' && !touchEvent) {
        this.onPlay();
      }
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
