<template>
  <div
    class="video-container"
    :class="{ 'cursor-none': !showcontrols}"
    @mousemove="mouse(1, $event)"
    @mouseleave="mouse(0, $event)"
    @click="container_clicked"
    ref="el"
  >
    <video class="video" ref="video_el"></video>
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

          <q-icon name="language" size="24px" class="on-right" v-if="audioTracks.length > 1">
            <q-menu anchor="top end" self="bottom right">
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="a in audioTracks"
                  :key="a.idx"
                  v-close-popup
                  clickable
                  :active="audioTrack === a.idx"
                  @click="audiotrack_activate(a.idx)"
                >
                  {{a.label}}
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>

          <q-icon name="closed_caption" size="24px" class="on-right" v-if="textTracks.length">
            <q-menu anchor="top end" self="bottom right">
              <q-list style="min-width: 10em" bordered dense>
                <q-item
                  v-for="s in textTracks"
                  :key="s.idx"
                  v-close-popup
                  clickable
                  :active="textTrack === s.idx"
                  @click="texttrack_activate(s.idx)"
                >
                  {{s.label}}
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :active="textTrack === null"
                  @click="texttrack_activate(null)"
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
  watch,
} from 'vue';
import { useQuasar } from 'quasar';

class Html5Video {
  constructor(element) {
    this.el = element;
    this.currentAudioTrack = 1;

    // When we have loaded the metadata,
    this.el.addEventListener('loadedmetadata', () => {
      this.metadata_loaded = true;
      if (this.hls_metadata_loaded && this.metadata_loaded_cb) {
        this.metadata_loaded_cb();
      }
    });
  }

  // Callback for when video has ended.
  onEnded(cb) {
    this.el.addEventListener('ended', () => cb());
  }

  // Callback for when all metadata has been loaded.
  onMetadataLoaded(cb) {
    this.metadata_loaded_cb = cb;
  }

  // pediodic callback.
  onTimeupdate(cb) {
    this.el.addEventListener('timeupdate', () => cb(this.el.currentTime));
  }

  // Private function, called when HLS manifest is loaded.
  onManifestLoaded() {
    this.hls_metadata_loaded = true;
    if (this.metadata_loaded && this.metadata_loaded_cb) {
      this.metadata_loaded_cb();
    }
  }

  // Load a new .mp4 or .m3u8 video.
  load(url) {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.el.src = null;
    if (url.endsWith('.m3u8')) {
      console.log('creating new hls', this.el);
      this.hls = new Hls();
      this.hls.on(Hls.Events.MANIFEST_LOADED, () => this.onManifestLoaded());
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => { console.log('attached', url); this.hls.loadSource(url); });
      this.hls.attachMedia(this.el);
    } else {
      console.log('plain video load', url);
      this.hls_metadata_loaded = true;
      this.el.load(url);
    }
  }

  // Play video.
  play() {
    this.el.play();
  }

  // Pause video.
  pause() {
    this.el.pause();
  }

  get currentTime() {
    return this.el.currentTime;
  }

  set currentTime(val) {
    this.el.currentTime = val;
  }

  get duration() {
    return this.el.duration;
  }

  get audioTracks() {
    if (this.hls) {
      return this.hls.audioTracks;
    }
    return [];
  }

  get audioTrack() {
    return this.currentAudioTrack;
  }

  set audioTrack(val) {
    if (this.hls) {
      this.hls.audioTrack = val;
    }
    this.currentAudioTrack = val;
  }

  get textTracks() {
    return this.el.textTracks;
  }

  get textTrack() {
    return this.currentTextTrack || null;
  }

  set textTrack(val) {
    for (let i = 0; i < this.el.textTracks.length; i += 1) {
      this.el.textTracks[i].mode = 'disabled';
    }
    if (val !== null) {
      this.el.textTracks[val].mode = 'showing';
    }
    this.currentTextTrack = val;
  }
}

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
      default: null,
    },
  },
  setup() {
    onMounted(() => {
      const instance = getCurrentInstance();
      instance.ctx.on_mounted();
    });

    return {
      video_el: ref(null),
      video: null,
      showcontrols: ref(2),
      slider: ref(0),
      moved_timer: null,
      play_icon: ref('play_arrow'),
      playing: false,
      ended: false,
      duration: ref(null),
      current: ref(0),
      textTracks: ref([]),
      textTrack: ref(null),
      audioTracks: ref([]),
      audioTrack: ref(0),
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
          // eslint-disable-next-line
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

    // Initialize.
    on_mounted() {
      this.video = new Html5Video(this.video_el);
      this.video.onMetadataLoaded(() => this.on_metadata_loaded());
      this.video.onEnded(() => {
        this.ended = true;
        this.playing = false;
        this.play_icon = 'replay';
      });
      this.video.onTimeupdate((val) => { this.current = val; });
      watch(() => this.url, (newUrl, oldUrl) => {
        if (newUrl !== oldUrl) {
          this.load(newUrl);
        }
      });
      if (this.url) {
        this.video.load(this.url);
      }
      window.video = this.video;
    },

    on_metadata_loaded() {
      this.current = this.video.currentTime || 0;
      console.log('duration now', this.duration, this.video.duration);
      if (!this.duration) {
        this.duration = this.video.duration;
      }
      this.slider = (this.current / this.duration) * 100;
      for (let i = 0; i < this.video.textTracks.length; i += 1) {
        const t = this.video.textTracks[i];
        if (t.kind === 'subtitles') {
          this.textTracks.push({
            idx: i,
            label: t.label,
          });
        }
      }
      for (let i = 0; i < this.video.audioTracks.length; i += 1) {
        const t = this.video.audioTracks[i];
        this.audioTracks.push({
          idx: i,
          label: t.name,
        });
      }
    },

    load(url) {
      console.log('load method called', url);
      this.video.load(url);
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
      this.current = (this.duration * pct) / 100;
      this.video.currentTime = this.current;
    },

    texttrack_activate(idx) {
      this.video.textTrack = idx;
      this.textTrack = idx;
    },

    audiotrack_activate(idx) {
      this.audioTrack = idx;
      this.video.audioTrack = idx;
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
