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
       :videoName="name"
       :deviceName="deviceName"
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

const DBG = false;

import {
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useQuasar } from 'quasar';
import VideoControls from 'components/VideoControls.vue';
import { sxe } from '../lib/util.js';
import { useApi } from '../lib/api.js';

export function canCast() {
  const quasar = useQuasar();
  const noMacCast = false; //quasar.platform.is.mac && process.env.DEV;
  return quasar.platform.is.chrome &&
    !(quasar.platform.is.ios || quasar.platform.is.tv || noMacCast)
}

export const Chromecast = defineComponent({
  name: 'Chromecast',
  components: {
    VideoControls,
  },

  setup() {
    const emitter = inject('emitter');
    const store = useStore();
    const currentTime = ref(0);
    const duration = ref(null);
    const currentVideo = ref(null);
    const api = useApi();

    let onGCastApiAvailable = null;

    onMounted(() => {
      watch(currentTime, () => {
        api
          .updateSeen(currentVideo.value, currentTime.value, duration.value)
          .catch((e) => { if (DBG) console.log('Chromecast: failed to updateSeen: ', e) });
      });

      const instance = getCurrentInstance();
      if (window.__isGCastApiAvailable) {
        instance.ctx.init_player();
      } else {
        onGCastApiAvailable = () => {
          instance.ctx.init_player();
        }
      }
    });

    onUnmounted(() => {
      onGCastApiAvailable = null;
    });

    // Load the Cast framework.
    const url = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    if (!document.querySelector(`script[src="${url}"]`)) {
      let cast = document.createElement('script');
      cast.setAttribute('src', url);
      cast.async = true;
      document.body.appendChild(cast);
    }

    // If the API becomes available before we have mounted, just set a flag.
    // If we have already mounted, execute callback.
    if (!window.__isGCastApiAvailable) {
      window.__onGCastApiAvailable = (isAvailable) => {
        if (isAvailable) {
          window.__isGCastApiAvailable = true;
          if (onGCastApiAvailable) {
            onGCastApiAvailable();
          }
        }
      }
    }

    return {
      api,
      playState: ref('idle'),
      currentVideo,
      currentTime,
      duration,
      volume: ref(1),
      muted: ref(false),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      buffering: ref(false),
      name: ref(null),
      deviceName: ref(null),
      emitter,
      store,
    };
  },

  methods: {

    receiverId() {
      const receiverIds = {
        notflix: 'DC2E9EDB',
        default: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      };
      const id = this.store.state.config.castReceiver;
      return receiverIds[id] || id;
    },

    initPlayerDebug() {
      const instance = window.cast.framework.CastContext.getInstance();
      const sessionRequest = new chrome.cast.SessionRequest(instance.ctx.receiverId());
      const apiConfig = new chrome.cast.ApiConfig(
        sessionRequest,
        (session) => {
          if (DBG) console.log('Chromecast: new session:', session);
          if (session.media.length !== 0) {
            if (DBG) console.log('Chromecast: Found multiple sessions: ', session.media.length);
          }
        },
        (ev) => {
          if (ev === 'available') {
            if (DBG) console.log('Chromecast: was found on the network.');
          } else {
            if (DBG) console.log('Chromecast: There are no Chromecasts available.');
          }
        },
        chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      );
      chrome.cast.initialize(
        apiConfig,
        () => { if (DBG) console.log('Chromecast: initialization succeeded'); },
        () => { if (DBG) console.log('Chromecast: initialization failed'); },
      );
    },

    init_player() {
      const instance = window.cast.framework.CastContext.getInstance();
      const options = {
        receiverApplicationId: this.receiverId(),
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        resumeSavedSession: true,
      };
      const castOptions = new window.cast.framework.CastOptions(options);
      instance.setOptions(castOptions);

      this._player = new window.cast.framework.RemotePlayer();
      this._controller = new window.cast.framework.RemotePlayerController(this._player);
      this.deviceName = 'Chromecast';

      // Add a listener for cast-device events (if there are any, etc)
      const { CAST_STATE_CHANGED } = window.cast.framework.CastContextEventType;
      instance.addEventListener(CAST_STATE_CHANGED, (newState) => {
        this.setCastStateNative(newState);
        const session = this.getSession();
        const connected = this._player.isConnected && session !== null;

        if (session) {
          this.deviceName = session.getCastDevice().friendlyName || this.deviceName;
        }
        // eslint-disable-next-line
        if (connected && session.getSessionState() === window.cast.framework.SessionState.SESSION_RESUMED) {
          this.mediaInfoChanged('INIT_PLAYER');
        }
      });
      const castState = instance.getCastState();
      if (DBG) console.log('Chromecast: casState now', castState);

      const handleEvent = (eventType, func) => {
        const t = window.cast.framework.RemotePlayerEventType[eventType];
        this._controller.addEventListener(t, func);
      };

      handleEvent('IS_CONNECTED_CHANGED', () => {
        const session = this.getSession();
        const connected = this._player.isConnected && session !== null;

        this.setCastState(connected ? 'connected' : 'disconnected');
        if (session) {
          this.deviceName = session.getCastDevice().friendlyName || this.deviceName;
        }
        // eslint-disable-next-line
        const SESSION_RESUMED = window.cast.framework.SessionState.SESSION_RESUMED;
        if (connected && session.getSessionState() === SESSION_RESUMED) {
          this.mediaInfoChanged('SESSION_RESUMED');
        }
      });

      handleEvent('MEDIA_INFO_CHANGED', () => this.mediaInfoChanged('MEDIA_INFO_CHANGED'));

      // handleEvent('CAN_SEEK_CHANGED', () => {
      //   this.canseek = this._player.canseek;
      // });

      handleEvent('CURRENT_TIME_CHANGED', () => {
        this.currentTime = this._player.currentTime;
        // if (DBG) console.log('Chromecast: current time changed');
        this.active(true);
      });

      handleEvent('IS_PAUSED_CHANGED', () => {
        if (DBG) console.log('Chromecast: is_paused changed');
        this.updateState();
        this.active(true);
      });

      handleEvent('IS_MUTED_CHANGED', () => {
        if (DBG) console.log('Chromecast: is_muted changed');
        this.muted = this._player.isMuted;
        this.active(true);
      });

      handleEvent('VOLUME_LEVEL_CHANGED', () => {
        if (DBG) console.log('Chromecast: volume_level changed', this._player.volumeLevel);
        this.volume = this._player.volumeLevel;
        // Don't trigger active(true) here, the OS might have done this on connect.
      });

      this.emitter.on('playCast', (video) => {
        if (DBG) console.log('Chromecast: playCast request', video);
        this.load(video);
      });
    },

    setCastStateNative(state) {
      // eslint-disable-next-line
      const CastState = window.cast.framework.CastState;
      if (DBG) console.log('Chromecast: setCastStateNative', state);
      switch (state.castState) {
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
          if (DBG) console.log('Chromecast: setCastStateNative: unknown state', state);
          break;
      }
    },

    setCastState(newState) {
      if (DBG) console.log('Chromecast: setCastState', newState);
      if (this.store.state.castState !== newState) {
        this.store.commit('castState', newState);
      }
      if (newState === 'no_devices' || newState === 'disconnected') {
        this.active(false);
      }
    },

    getCastState() {
      return this.store.castState;
    },

    mediaInfoChanged(id) {
      if (DBG) console.log('Chromecast: mediaInfoChanged from', id);
      const session = this.getSession();
      if (!session) {
        return;
      }
      if (DBG) console.log('Chromecast: mediaInfoChanged: getSessionObj: ', session.getSessionObj());
      const media = session.getMediaSession();
      if (!media) {
        if (DBG) console.log('Chromecast: mediaInfoChanged: no media');
        this.resetState();
        return;
      }
      if (DBG) console.log('Chromecast: mediaInfoChanged:', media);
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

      if (DBG) console.log('Chromecast: calling updateState');
      this.updateState(media);
    },

    active(flag) {
      if (this.store.state.castActive !== flag) {
        if (DBG) console.log('Chromecast: setting castActive', this.store.state.castActive, ' -> ', flag);
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
        this.setPlayState('paused');
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

    load(item) {
      this.currentVideo = item;

      // Make URL absolute.
      const src = new URL(item.src, window.location.origin).href;
      if (DBG) console.log('Chromecast: chromecast.load', src);

      const mediaInfo = new chrome.cast.media.MediaInfo(src, 'video/mp4');
      mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;

      const images = [];
      if (item.poster) {
        const posterUrl = new URL(item.poster, window.location.origin).href;
        images.push(new chrome.cast.Image(posterUrl));
      }
      if (item.type === 'movie') {
        const meta = new chrome.cast.media.MovieMediaMetadata();
        meta.title = item.title;
        meta.images = images;
        meta.releaseYear = item.year;
        mediaInfo.metadata = meta;
        this.name = item.title;
      }
      if (item.type === 'episode') {
        const meta = new chrome.cast.media.TvShowMediaMetadata();
        meta.title = item.title;
        meta.images = images;
        meta.releaseYear = item.year;
        meta.season = item.season;
        meta.episode = item.episode;
        meta.seriesTitle = item.seriesTitle;
        mediaInfo.metadata = meta;
        this.name = `${item.seriesTitle} ${sxe(item.season, item.episode)}`;
      }

      switch (this.store.state.config.castReceiver) {
        case 'notflix':
          // nothing to do.
          break;
        case 'default':
          // default media receiver.
          if (src.match(/\.m3u8(\?.*|)$/)) {
            // These must be set to FMP4, or the chromecast will hang.
            mediaInfo.hlsSegmentFormat = chrome.cast.media.HlsSegmentFormat.FMP4;
            mediaInfo.hlsVideoSegmentFormat = chrome.cast.media.HlsVideoSegmentFormat.FMP4;
            // StreamType must be LIVE or OTHER, not BUFFERED.
            mediaInfo.streamType = chrome.cast.media.StreamType.OTHER;
            // And ofcourse the MIME type.
            mediaInfo.contentType = 'application/x-mpegURL';
          }
          break;
        default:
          // custom receiver should handle anything itself.
          break;
      }

      // Netflix subtitle styling
      // chrome.cast.media.TextTrackFontGenericFamily.CASUAL
      // chrome.cast.media.TextTrackEdgeType.DROP_SHADOW
      mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
      mediaInfo.textTrackStyle.backgroundColor = '#00000000';
      mediaInfo.textTrackStyle.edgeColor = '#000016';
      mediaInfo.textTrackStyle.edgeType = 'DROP_SHADOW';
      mediaInfo.textTrackStyle.fontFamily = 'CASUAL';
      mediaInfo.textTrackStyle.fontScale = 1.0;
      mediaInfo.textTrackStyle.foregroundColor = '#FFFFFF';

      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = item.startAt || 0;
      request.autoplay = this.playState !== 'paused';

      if (DBG) console.log('Chromecast: chromecast: getting session');
      const session = this.getSession();
      if (!session) {
        if (DBG) console.log('Chromecast: chromecast: no session');
        return;
      }
      if (DBG) console.log(`Chromecast: chromecast: loadMedia. name is ${this.name}, deviceName is ${this.deviceName}`);
      this.store.commit('castActive', true);

      session.loadMedia(request).then(
        () => {
          // eslint-disable-next-line
          if (DBG) console.log('chromecast: remote media loaded');
          this.currentSrc = src;
        },
        (errorCode) => {
          const errorMessage = this.getErrorMessage(errorCode);
          // eslint-disable-next-line
          if (DBG) console.log(`chromecast: media load error: ${errorMessage}`);
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
          if (DBG) console.log('Chromecast: unknown playerState', this._player.PlayerState);
          break;
      }
    },

    setPlayState(playState) {
      if (playState === 'idle') {
        if (DBG) console.log('set castActive to', false);
        this.store.commit('castActive', false);
      }
      if (DBG) console.log('Chromecast: setPlayState', playState);
      if (DBG) console.log('playState !== idle', playState !== 'idle');
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
      if (DBG) console.log('tracks:', type, ': ', tracks);
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
          if (DBG) console.log('activeTrack:', type, t.trackId);
          return t.trackId;
        }
      }
      if (DBG) console.log('activeTrack:', type, null);
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
export default Chromecast;
</script>
