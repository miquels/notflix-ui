import API from './api.js';

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
      title: episode.name,
      poster: season.poster || show.poster,
      thumb: episode.thumb,
      episode: episode.episodeno,
      season: season.seasonno,
      seriesTitle: show.title || show.name,
    };
    return this.finalize(info);
  }

  // Create PlayerInfo for a movie.
  movie(movie) {
    const info = {
      type: 'movie',
      src: movie.video,
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
    const api = new API;

    // Movie?
    if (!route.params.episode) {
      const item = await api.getMovie(route.params.collection, route.params.name);
      return this.movie(item);
    }

    const item = await api.getShow(route.params.collection, route.params.name);
    console.log('item: ', item);
    console.log('params: ', route.params);

    // Find the episode.
    const se = Number(route.params.season.replace(/^s?0*/, ''));
    const ep = Number(route.params.episode.replace(/^e?0*/, ''));
    const season = item.seasons.find((s) => s.seasonno === se);
    const episode = season.episodes.find((e) => e.episodeno === ep);

    return this.episode(item, season, episode);
  }
}
