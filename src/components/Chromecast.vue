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
       :castState="castState"
       @play="on_play"
       @seek="on_seek"
       @volume="on_volume"
       @texttrack="on_texttrack"
       @audiotrack="on_audiotrack"
       @muted="on_muted"
    />
  </div>
</template>

<style>
.chromecast-container {
  position: relative;
  background: black;
}
.chromecast-controls {
  width: 100%;
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
  onMounted,
  ref,
  watch,
} from 'vue';
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

    return {
      currentTime: ref(0),
      duration: ref(null),
      volume: ref(0.5),
      muted: ref(false),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
      castState: ref('disconnected'),
      buffering: ref(false),
    };
  },

  methods: {

    // Initialize.
    on_mounted() {
      console.log('on_mounted');

      // eslint-disable-next-line
      this.cast = window.chrome.cast;

      let options = {};
      options.receiverApplicationId = 'CC1AD845';
      options.autoJoinPolicy = this.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
      this.cast.framework.CastContext.getInstance().setOptions(options);

      this._player = new this.cast.framework.RemotePlayer();
      this._controller = new this.cast.framework.RemotePlayerController(this._player);

      const handleEvent = (eventType, func) => {
        this._controller.addEventListener(this.cast.framework.RemotePlayerEventType[eventType], func);
      };

      handleEvent('IS_CONNECTED_CHANGED', () => {
        const session = this.getSession();
        const connected = this._player.isConnected && session !== null;
        const state = this.state.castState;

        if (session) {
          this.deviceName = session.getCastDevice().friendlyName || this.deviceName;
        }
        this.castState = connected ? 'connected' : 'disconnected';
        if (connected && state === 'disconnected') {
          if (this.src) {
            // XXX FIXME either attach to existing session, or load + play
            this.load(this.src);
          }
        }
      });

      handleEvent('MEDIA_LOADED_CHANGED', () => {
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
        // this.currentSrc = mediaInfo.contentId;
        // this.currentTitle = mediaInfo.metadata.title;
        // this.currentDescription = mediaInfo.metadata.subtitle;
        this.duration = mediaInfo.duration;
        // this.canseek = this._player.canSeek;

        this.textTracks = this.getTracks('TEXT');
        this.textTrack = this.getActiveTrack('TEXT');
        this.audioTracks = this.getTracks('AUDIO');
        this.audioTrack = this.getActiveTrack('AUDIO');
      });

      // handleEvent('CAN_SEEK_CHANGED', () => {
      //   this.canseek = this._player.canseek;
      // });

      handleEvent('IS_PAUSED_CHANGED', () => {
        this.updateState();
      });

      handleEvent('IS_MUTED_CHANGED', () => {
        this.muted = this._player.isMuted;
      });

      handleEvent('VOLUME_LEVEL_CHANGED', () => {
        this.volume = this._player.volumeLevel;
      });

      // watch(() => this.src, (newSrc, oldSrc) => {
      //   console.log('watch -> load', this.src, newSrc, oldSrc);
      //   if (newSrc !== oldSrc) {
      //     this.load(newSrc);
      //   }
      // });
    },

    on_play() {
      if (this.playState === 'ended') {
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
      if (this.playState === 'ended') {
        this.playState = 'paused';
      }
      this._player.currentTime = val;
      this._controller.seek();
    },

    on_volume(val) {
      this._player.volumeLevel = val;
    }
 
    load(src, startAt) {
      const mediaInfo = new this.cast.media.MediaInfo(src, 'video/mp4');
      mediaInfo.streamType = this.cast.media.StreamType.BUFFERED;

      if (src.endsWith('.m3u8')) {
        // These must be set to FMP4, or the chromecast will hang.
        mediaInfo.hlsSegmentFormat = this.cast.media.HlsSegmentFormat.FMP4;
        mediaInfo.hlsVideoSegmentFormat = this.cast.media.HlsVideoSegmentFormat.FMP4;
        // StreamType must be LIVE or OTHER, not BUFFERED.
        mediaInfo.streamType = this.cast.media.StreamType.OTHER;
        // And ofcourse the MIME type.
        mediaInfo.contentType = 'application/x-mpegURL';
      }

      mediaInfo.metadata = new this.cast.media.GenericMediaMetadata();

      const request = new this.cast.media.LoadRequest(mediaInfo);
      request.currentTime = startAt || 0;
      request.autoplay = this.playState !== 'paused';

      const session = this.getSession();
      if (!session) {
        return;
      }
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
          this.playState = 'idle';
        },
      );
    },

    // Get the current session. If we cannot, and are not disconnected,
    // treat this is a disconnection event.
    getSession() {
      const instance = this.cast.framework.CastContext.getInstance();
      if (instance) {
        const session = instance.getCurrentSession();
        if (session) {
          return session;
        }
      }
      this.castState = 'disconnected';
      return null;
    }

    // Update the current playerState.
    updateState() {
      switch (this._player.playerState) {
        case 'IDLE':
          this.playState = 'idle';
          this.buffering = false;
          break;
        case 'PLAYING':
          this.playState = 'playing';
          this.buffering = false;
          break;
        case 'PAUSED':
          this.playState = 'paused';
          this.buffering = false;
          break;
        case 'BUFFERING':
          this.buffering = true;
          break;
        default:
          break;
      }
    }

    // Get all the tracks of a type ('AUDIO' or 'TEXT').
    getTracks(type) {
      const session = this.getSession();
      if (!session) {
        return [];
      }
      const media = session.getMediaSession();
      if (!media) {
        return [];
      }
      const mediaInfo = media.media;
      const tracks = [];
      // eslint-disable-next-line
      for (let i in mediaInfo.tracks.values) {
        const t = mediaInfo.tracks[i];
        if (t.type === type) {
          tracks.push({
            label: t.name,
            id: t.id,
          });
        }
      }
      return tracks;
    }

    // Get the active tracks of a type ('AUDIO' or 'TEXT').
    getActiveTrack(type) {
      const session = this.getSession();
      if (!session) {
        return [];
      }
      const media = session.getMediaSession();
      if (!media) {
        return [];
      }
      const mediaInfo = media.media;
      const active = session.getSessionObj().media[0].activeTrackIds;
      // eslint-disable-next-line
      for (let i in mediaInfo.tracks) {
        const t = mediaInfo.tracks[i];
        if (t.type === type && active.includes(t.id)) {
          return t.id;
        }
      }
      return null;
    }

    // Set the active track.
    setActiveTrack(type, id) {
      const session = this.getSession();
      if (!session) {
        return;
      }
      const media = session.getMediaSession();
      if (!media) {
        return;
      }
      const mediaInfo = media.media;
      const active = session.getSessionObj().media[0].activeTrackIds;
      const newActive = [];
      // eslint-disable-next-line
      for (let i in active) {
        if (mediaInfo.tracks[i].type !== type) {
          newActive.push(i);
        }
      }
      newActive.push(parseInt(id, 10));
      const request = new this.cast.media.EditTracksInfoRequest(newActive);
      session.getSessionObj().media[0].editTracksInfo(request, () => {
        switch (type) {
          case 'AUDIO':
            this.state.audioTrack = this.getActiveTrack(type);
            this.trigger('audiochanged', this.state.audioTrack);
            break;
          case 'TEXT':
            this.state.textTrack = this.getActiveTrack(type);
            this.trigger('subtitlechanged', this.state.textTrack);
            break;
          default:
            break;
        }
      });
    }

    static getErrorMessage(error) {
      // eslint-disable-next-line
      const chrome = chrome;
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
    }
});
</script>
