import { useApi } from './api.js';
import { decodeSE, encodeSE } from './util.js';
import { useRouter } from 'vue-router';

//
// Both components/Movie and components/TvShow can build this class
// to get a PlayerInfo, which can then be passed to player components
// like Chromecast, LocalPlayer or IosPlayer.
//
export class PlayerInfoFactory {
  constructor(quasar, store) {
    this.quasar = quasar;
    this.store = store;
  }

  finalize(info) {
    if (info.poster) {
      info.poster += '?q=70&w=266&h=400';
    }
    if (info.thumb) {
      info.thumb += '?q=70';
    }
    const iosSafari = this.quasar.platform.is.safari && this.quasar.platform.is.ios;
    if (this.store.state.config.streamingFormat === 'hls' || iosSafari) {
      info.src += '/master.m3u8';
    }
    return info;
  }

  // Create PlayerInfo for an episode.
  episode(show, season, episode) {
    let info = {
      type: 'episode',
      src: episode.video,
      id: show.id,
      collection: show.collection,
      title: episode.name,
      poster: season.poster || show.poster,
      thumb: episode.thumb,
      episode: episode.episodeno,
      season: season.seasonno,
      seasonEpisode: encodeSE(season.seasonno, episode.episodeno),
      seriesTitle: show.title || show.name,
    };
    return this.finalize(info);
  }

  // Create PlayerInfo for a movie.
  movie(movie) {
    const info = {
      type: 'movie',
      src: movie.video,
      id: movie.id,
      collection: movie.collection,
      title: movie.name,
      poster: movie.poster,
    };
    if (movie.nfo) {
      info.title = movie.nfo.title;
      info.year = movie.nfo.year;
    }
    return this.finalize(info);
  }

  // Create PlayerInfo from a route.
  //
  // Might seem expensive, but we have all the info that we need already in cache.
  async fromRoute(route) {
    const router = useRouter();
    const api = useApi();

    // Parse ?t=<seconds> query parameter.
    let t;
    if (route.query && route.query.t) {
      let t2 = parseInt(route.query.t);
      if (!isNaN(t2)) {
        t = t2;
      }
    }

    // Movie?
    if (!route.params.seasonEpisode) {
      const item = await api.getMovie(route.params.collection, route.params.id);
      return { ...this.movie(item), currentTime: t };
    }

    // TvShow.
    const item = await api.getShow(route.params.collection, route.params.id);
    console.log('playerinfo: item: ', item);
    // console.log('playerinfo: params: ', route.params);
    // console.log('playerinfo: query: ', route.query);
    if (!item) {
      router.replace({ name: '404' });
      return;
    }

    const se = decodeSE(route.params.seasonEpisode);
    if (!se) {
      router.replace({ name: '404' });
      return;
    }

    // Find the episode.
    const season = item.seasons.find((s) => s.seasonno === se.season);
    const episode = season.episodes.find((e) => e.episodeno === se.episode);
    if (!season || !episode) {
      router.replace({ name: '404' });
      return;
    }

    return { ...this.episode(item, season, episode), currentTime: t };
  }
}
