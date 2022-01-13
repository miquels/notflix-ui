<template>
  <div/>
</template>

<script>
import {
  defineComponent,
  inject,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Play',

  setup() {
    const quasar = useQuasar();
    const store = useStore();
    const emitter = inject('emitter');
    const router = useRouter();

    const iosSafari = quasar.platform.is.safari && quasar.platform.is.ios;

    emitter.on('playVideo', (vid) => {
      console.log('play!', vid);
      let info;

      if (vid.type === 'episode') {
        info = {
          type: 'episode',
          src: vid.episode.video,
          title: vid.episode.name,
          thumb: vid.episode.thumb,
          episode: vid.episode.episodeno,
          season: vid.season.seasonno,
          seriesTitle: vid.show.title || vid.show.name,
        };
        if (vid.episode.nfo) {
          info.title = vid.episode.nfo.title;
        }
      }

      if (vid.type === 'movie') {
        info = {
          type: 'movie',
          src: vid.movie.video,
          title: vid.movie.name,
        };
        if (vid.movie.nfo) {
          info.thumb = vid.movie.poster;
          info.title = vid.movie.nfo.title;
          info.year = vid.movie.nfo.year;
        }
      }

      if (store.state.config.useHls || iosSafari) {
        info.src += '/master.m3u8';
      }

      console.log('playing', info);
      store.commit('currentVideo', info);
      if (store.state.castState === 'connected') {
        emitter.emit('playCast');
      } else if (iosSafari) {
        router.push('/ios-player/');
      } else {
        router.push('/local-player/');
      }
    });
  },
});
</script>
