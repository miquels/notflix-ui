<template>
  <div class="chromecast-container">
    <VideoControls
       class="chromecast-controls"
       :playState="playState"
       :volume="volume"
       :currentTime="currentTime"
       :duration="duration"
       :muted="muted"
       :buffering="buffering"
       :textTrack="textTrack"
       :textTracks="textTracks"
       :audioTrack="audioTrack"
       :audioTracks="audioTracks"
       :stopButton="true"
       @play="on_play"
       @seek="on_seek"
       @volume="on_volume"
       @texttrack="on_texttrack"
       @audiotrack="on_audiotrack"
       @muted="on_muted"
       @cast="on_cast"
       @stop="on_stop"
    />
  </div>
</template>

<style>
.chromecast-container {
  position: relative;
  background: black;
  width: 100%;
}
.chromecast-controls {
  width: 100%;
  color: white;
}
</style>

<script>
/* eslint no-underscore-dangle: "off" */
/* eslint prefer-template: "off" */
/* eslint operator-linebreak: "off" */
/* eslint no-console: "off" */

import {
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import VideoControls from 'components/VideoControls.vue';

export default defineComponent({
  name: 'Chromecast',
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
    const emitter = inject('emitter');
    const store = useStore();

    return {
      playState: ref('idle'),
      currentTime: ref(0),
      duration: ref(null),
      volume: ref(1),
      muted: ref(false),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      buffering: ref(false),
      emitter,
      store,
    };
  },

  methods: {

    // Initialize.
    on_mounted() {
      console.log('chromecast on_mounted');

      if (!window.chrome || !chrome.cast || !chrome.cast.isAvailable) {
        window.__onGCastApiAvailable = (isAvailable) => {
          if (isAvailable) {
            this.init_player();
          }
        };
        return;
      }
      delete window.__onGCastApiAvailable;
      this.init_player();
    },

    initPlayerDebug() {
      const appID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      const sessionRequest = new chrome.cast.SessionRequest(appID);
      const apiConfig = new chrome.cast.ApiConfig(
        sessionRequest,
        (session) => {
          console.log('New session:', session);
          if (session.media.length !== 0) {
            console.log('Found multiple sessions: ', session.media.length);
          }
        },
        (ev) => {
          if (ev === 'available') {
            console.log('Chromecast was found on the network.');
          } else {
            console.log('There are no Chromecasts available.');
          }
        },
      );
      chrome.cast.initialize(
        apiConfig,
        () => { console.log('initialization succeeded'); },
        () => { console.log('initialization failed'); },
      );
    },

    init_player() {
      console.log('init_player');
      // this.initPlayerDebug();

      const options = {};
      // options.receiverApplicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      // options.receiverApplicationId = 'CC1AD845';
      options.receiverApplicationId = 'DC2E9EDB';
      options.autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;
      window.cast.framework.CastContext.getInstance().setOptions(options);

      this._player = new window.cast.framework.RemotePlayer();
      this._controller = new window.cast.framework.RemotePlayerController(this._player);

      // Add a listener for cast-device events (if there are any, etc)
      const instance = window.cast.framework.CastContext.getInstance();
      const CastEvent = window.cast.framework.CastContextEventType.CAST_STATE_CHANGED;
      instance.addEventListener(CastEvent, (state) => this.setCastStateNative(state));
      const castState = window.cast.framework.CastContext.getInstance().getCastState();
      console.log('casState now', castState);

      const handleEvent = (eventType, func) => {
        const t = window.cast.framework.RemotePlayerEventType[eventType];
        this._controller.addEventListener(t, func);
      };

      handleEvent('IS_CONNECTED_CHANGED', () => {
        const session = this.getSession();
        const connected = this._player.isConnected && session !== null;
        const state = this.getCastState;

        this.setCastState(connected ? 'connected' : 'disconnected');
        if (session) {
          this.deviceName = session.getCastDevice().friendlyName || this.deviceName;
        }
        // eslint-disable-next-line
        if (connected && session.getSessionState() === window.cast.framework.SessionState.SESSION_RESUMED) {
          this.mediaInfoChanged();
          return;
        }
        if (connected && state === 'disconnected') {
          // Initial connected. If we have a src, play it.
          if (this.src) {
            this.load(this.src, this.startAt);
          }
        }
      });

      handleEvent('MEDIA_INFO_CHANGED', () => this.mediaInfoChanged());

      // handleEvent('CAN_SEEK_CHANGED', () => {
      //   this.canseek = this._player.canseek;
      // });

      handleEvent('CURRENT_TIME_CHANGED', () => {
        this.currentTime = this._player.currentTime;
        this.active(true);
      });

      handleEvent('IS_PAUSED_CHANGED', () => {
        this.updateState();
        this.active(true);
      });

      handleEvent('IS_MUTED_CHANGED', () => {
        this.muted = this._player.isMuted;
        this.active(true);
      });

      handleEvent('VOLUME_LEVEL_CHANGED', () => {
        this.volume = this._player.volumeLevel;
        this.active(true);
      });

      this.emitter.on('playCast', (src) => {
        console.log('playCast request', src);
        this.load(src);
      });

      watch(() => this.src, (newSrc, oldSrc) => {
        console.log('watch -> load', this.src, newSrc, oldSrc);
        if (newSrc !== oldSrc) {
          this.load(newSrc);
        }
      });
    },

    setCastStateNative(state) {
      // eslint-disable-next-line
      const CastState = window.cast.framework.CastState;
      console.log('Chromecast: setCastStateNative', state);
      switch (state) {
        case CastState.NO_DEVICES_AVAILABLE:
          this.setCastState('no_devices');
          break;
        case CastState.NOT_CONNECTED:
          this.setCastState('disconnected');
          break;
        case CastState.CONNECTED:
          this.setCastState('connected');
          break;
        default:
          break;
      }
    },

    setCastState(newState) {
      if (this.store.state.castState !== newState) {
        console.log('Chromecast: setCastState', newState);
        this.store.commit('castState', newState);
      }
      this.active(newState === 'connected');
    },

    getCastState() {
      return this.store.castState;
    },

    mediaInfoChanged() {
      const session = this.getSession();
      if (!session) {
        return;
      }
      const media = session.getMediaSession();
      if (!media) {
        console.log('Chromecast.mediaInfoChanged: no media');
        this.resetState();
        return;
      }
      console.log('Chromecast.mediaInfoChanged:', media);
      const mediaInfo = media.media;
      // this.currentSrc = mediaInfo.contentId;
      // this.currentTitle = mediaInfo.metadata.title;
      // this.currentDescription = mediaInfo.metadata.subtitle;
      this.duration = mediaInfo.duration;
      // this.canseek = this._player.canSeek;

      this.textTracks = this.getTracks(media, 'TEXT');
      this.textTrack = this.getActiveTrack(media, 'TEXT');
      this.audioTracks = this.getTracks(media, 'AUDIO');
      this.audioTrack = this.getActiveTrack(media, 'AUDIO');

      console.log('calling updateState');
      this.updateState(media);
    },

    active(flag) {
      if (this.store.state.castActive !== flag) {
        this.store.commit('castActive', flag);
      }
    },

    on_play() {
      if (this.playState === 'idle') {
        this._player.currentTime = 0;
        this._controller.seek();
      }
      this._controller.playOrPause();
    },

    on_stop() {
      this._controller.stop();
    },

    on_muted(val) {
      if ((this._player.isMuted && !val) ||
          (!this._player.isMuted && val)) {
        this._controller.muteOrUnmute();
      }
    },

    on_seek(val) {
      if (this.playState === 'idle') {
        this.setPlayStat('paused');
      }
      this._player.currentTime = val;
      this._controller.seek();
    },

    on_volume(val) {
      this._player.volumeLevel = val;
    },

    on_audiotrack(val) {
      this.setActiveTrack('AUDIO', val);
    },

    on_texttrack(val) {
      this.setActiveTrack('TEXT', val);
    },

    resetState() {
      this.setPlayState('idle');
      this.currentTime = 0;
      this.duration = 0;
      this.volume = 1;
      this.muted = false;
      this.textTracks = [];
      this.textTrack = null;
      this.audioTracks = [];
      this.audioTrack = null;
      this.buffering = false;
    },

    on_cast() {
      const instance = window.cast.framework.CastContext.getInstance();
      instance.requestSession();
    },

    load(src, startAt) {
      const mediaInfo = new chrome.cast.media.MediaInfo(src, 'video/mp4');
      mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;

      console.log('chromecast.load', src);

      if (src.match(/\.m3u8(\?.*|)$/)) {
        // These must be set to FMP4, or the chromecast will hang.
        // mediaInfo.hlsSegmentFormat = chrome.cast.media.HlsSegmentFormat.FMP4;
        // mediaInfo.hlsVideoSegmentFormat = chrome.cast.media.HlsVideoSegmentFormat.FMP4;
        // StreamType must be LIVE or OTHER, not BUFFERED.
        // mediaInfo.streamType = chrome.cast.media.StreamType.OTHER;
        // And ofcourse the MIME type.
        // mediaInfo.contentType = 'application/x-mpegURL';
        console.log('setting content-type to dash');
        mediaInfo.contentType = 'application/dash+xml';
      }

      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();

      // Netflix subtitle styling
      // chrome.cast.media.TextTrackFontGenericFamily.CASUAL
      // chrome.cast.media.TextTrackEdgeType.DROP_SHADOW
      mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
      mediaInfo.textTrackStyle.backgroundColor = '#00000000';
      mediaInfo.textTrackStyle.edgeColor = '#00000016';
      mediaInfo.textTrackStyle.edgeType = 'DROP_SHADOW';
      mediaInfo.textTrackStyle.fontFamily = 'CASUAL';
      mediaInfo.textTrackStyle.fontScale = 1.0;
      mediaInfo.textTrackStyle.foregroundColor = '#FFFFFF';

      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = startAt || 0;
      request.autoplay = this.playState !== 'paused';

      console.log('chromecast: getting session');
      const session = this.getSession();
      if (!session) {
        console.log('chromecast: no session');
        return;
      }
      console.log('chromecast: loadMedia');
      this.store.commit('castActive', true);

      session.loadMedia(request).then(
        () => {
          // eslint-disable-next-line
          console.log('chromecast: remote media loaded');
          this.currentSrc = src;
        },
        (errorCode) => {
          const errorMessage = this.getErrorMessage(errorCode);
          // eslint-disable-next-line
          console.log(`chromecast: media load error: ${errorMessage}`);
          this.setPlayState('idle');
        },
      );
    },

    // Get the current session. If we cannot, and are not disconnected,
    // treat this is a disconnection event.
    getSession() {
      const instance = window.cast.framework.CastContext.getInstance();
      if (instance) {
        const session = instance.getCurrentSession();
        if (session) {
          return session;
        }
      }
      this.setCastState('disconnected');
      return null;
    },

    // Update the current playerState.
    updateState(media) {
      if (!media) {
        const session = this.getSession();
        if (!session) {
          return;
        }
        media = session.getMediaSession();
        if (!media) {
          this.resetState('idle');
          return;
        }
      }
      switch (media.playerState) {
        case 'IDLE':
          this.setPlayState('idle');
          this.buffering = false;
          break;
        case 'PLAYING':
          this.setPlayState('playing');
          this.buffering = false;
          break;
        case 'PAUSED':
          this.setPlayState('paused');
          this.buffering = false;
          break;
        case 'BUFFERING':
          this.buffering = true;
          break;
        default:
          console.log('Chromecast: unknown playerState', this._player.PlayerState);
          break;
      }
    },

    setPlayState(playState) {
      if (playState === 'idle') {
        this.store.commit('castActive', false);
      }
      console.log('Chromecast: setPlayState', playState);
      this.active(playState !== 'idle');
      this.playState = playState;
    },

    // Get all the tracks of a type ('AUDIO' or 'TEXT').
    getTracks(media, type) {
      const mediaInfo = media.media;
      const tracks = [];
      if (!mediaInfo.tracks) {
        return [];
      }
      // eslint-disable-next-line
      for (let i in mediaInfo.tracks) {
        const t = mediaInfo.tracks[i];
        if (t.type === type) {
          tracks.push({
            label: t.name || t.language || t.trackId,
            id: t.trackId,
          });
        }
      }
      console.log('tracks:', type, ': ', tracks);
      return tracks;
    },

    // Get the active tracks of a type ('AUDIO' or 'TEXT').
    getActiveTrack(media, type) {
      const mediaInfo = media.media;
      const active = media.activeTrackIds;
      // eslint-disable-next-line
      for (let i in mediaInfo.tracks) {
        const t = mediaInfo.tracks[i];
        if (t.type === type && active.includes(t.trackId)) {
          console.log('activeTrack:', type, t.trackId);
          return t.trackId;
        }
      }
      console.log('activeTrack:', type, null);
      return null;
    },

    // Set the active track.
    setActiveTrack(type, id) {
      const session = this.getSession();
      if (!session) {
        return;
      }
      const media = session.getMediaSession();
      if (!media) {
        this.resetState('idle');
        return;
      }
      const mediaInfo = media.media;
      const active = media.activeTrackIds;
      const newActive = [];
      // eslint-disable-next-line
      for (let i in mediaInfo.tracks) {
        const t = mediaInfo.tracks[i];
        if (active.includes(t.trackId) && t.type !== type) {
          newActive.push(t.trackId);
        }
      }
      if (id !== null) {
        newActive.push(parseInt(id, 10));
      }
      const request = new chrome.cast.media.EditTracksInfoRequest(newActive);
      media.editTracksInfo(request, () => {
        switch (type) {
          case 'AUDIO':
            this.audioTrack = this.getActiveTrack(media, type);
            break;
          case 'TEXT':
            this.textTrack = this.getActiveTrack(media, type);
            break;
          default:
            break;
        }
      });
    },

    getErrorMessage(error) {
      if (!window.chrome || !chrome || !chrome.cast) {
        return 'Error code: ' + error;
      }
      switch (error.code) {
        case chrome.cast.ErrorCode.API_NOT_INITIALIZED:
          return 'The API is not initialized.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.CANCEL:
          return 'The operation was canceled by the user' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.CHANNEL_ERROR:
          return 'A channel to the receiver is not available.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.EXTENSION_MISSING:
          return 'The Cast extension is not available.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.INVALID_PARAMETER:
          return 'The parameters to the operation were not valid.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.RECEIVER_UNAVAILABLE:
          return 'No receiver was compatible with the session request.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.SESSION_ERROR:
          return 'A session could not be created, or a session was invalid.' +
            (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.TIMEOUT:
          return 'The operation timed out.' +
            (error.description ? ' :' + error.description : '');
        default:
          break;
      }
      return error;
    },
  },
});
</script>
