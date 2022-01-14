/*
 * api.js Talk to the API.
 * var API = require('api.js')
 *
 * var api = new API({ url: url})
 * var collections = api.getcollections();
 * var collection = api.getcollection('collectionname');
 *
 * var shows = api.getitems(collectionname)
 * var show = api.getitem(collectionname, showname)
 *
 * var movies = api.getitems(collectionname)
 * var movie = api.getitem(collectionname, showname)
 */

import { useStore } from 'vuex';
import { joinpath } from './util.js';

const objectCache = {};
const requestsPending = {};
let idCounter = 1;

function updateNfo(base, item) {
  if (!item.nfo) {
    item.nfo = {};
  }
  if (!item.nfo.title) {
    item.nfo.title = item.name || '(No Title)';
  }
  if (item.nfo.thumb) {
    item.nfo.thumb = joinpath(base.path, item.nfo.thumb);
  }
}

function updateEpisode(show, episode) {
  updateNfo(show, episode);
  if (episode.thumb) episode.thumb = joinpath(show.path, episode.thumb);
  if (episode.video) {
    episode.video = joinpath(show.path, episode.video);
  }
}

function updateShow(apiUrl, theShow) {
  // console.log('updateShow', apiUrl, theShow);
  const show = JSON.parse(JSON.stringify(theShow));
  show.path = joinpath(apiUrl, show.baseurl, show.path);
  // console.log('show.path is now', show.path);
  updateNfo(show, show);
  if (show.banner) show.banner = joinpath(show.path, show.banner);
  if (show.fanart) show.fanart = joinpath(show.path, show.fanart);
  if (show.poster) show.poster = joinpath(show.path, show.poster);
  // console.log('aaa, now path and fanart', show.path, show.fanart);
  if (show.seasonAllBanner) {
    show.seasonAllBanner = joinpath(show.path, show.seasonAllBanner);
  }
  if (show.seasonAllPoster) {
    show.seasonAllPoster = joinpath(show.path, show.seasonAllPoster);
  }
  // eslint-disable-next-line
  for (const season of show.seasons) {
    if (season.poster) {
      season.poster = joinpath(show.path, season.poster);
    }
    // eslint-disable-next-line
    for (const episode of season.episodes) {
      updateEpisode(show, episode);
    }
  }
  return show;
}

function updateMovie(apiUrl, theMovie) {
  const movie = JSON.parse(JSON.stringify(theMovie));
  movie.path = joinpath(apiUrl, movie.baseurl, movie.path);
  updateNfo(movie, movie);
  if (movie.banner) movie.banner = joinpath(movie.path, movie.banner);
  if (movie.fanart) movie.fanart = joinpath(movie.path, movie.fanart);
  if (movie.poster) movie.poster = joinpath(movie.path, movie.poster);
  if (movie.video) {
    movie.video = joinpath(movie.path, movie.video);
  }
  return movie;
}

export default class API {
  url;

  constructor() {
    // Make this a singleton.
    if (API._instance) {
      return API._instance;
    }
    API._instance = this;
    const store = useStore();
    this.url = store.getters.config.apiUrl;
  }

  getObject(path) {
    if (objectCache[path] !== undefined) {
      return Promise.resolve(objectCache[path]);
    }

    let pending = requestsPending[path];
    if (pending !== undefined && pending.length > 0) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    }

    const reqUrl = joinpath(this.url, path);
    // console.log('getObj url path req', this.url, path, reqUrl)
    pending = [];
    requestsPending[path] = pending;
    // console.log('DBG: api.getObject: requesting', reqUrl)

    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });

      fetch(reqUrl, {
        redirect: 'follow',
      }).then((resp) => {
        if (!resp.ok) {
          throw new RangeError(`unexpected HTTP code: ${resp.status}`);
        }
        // console.log('response:', resp)
        resp.json().then((obj) => {
          obj.id = idCounter;
          idCounter += 1;
          const frozenObj = Object.freeze(obj);
          objectCache[path] = frozenObj;
          while (pending.length > 0) {
            const p = pending.shift();
            p.resolve(frozenObj);
          }
        });
      }).catch((err) => {
        while (pending.length > 0) {
          const p = pending.shift();
          p.reject(err);
        }
      });
    });
  }

  getCollections() {
    return this.getObject('/api/collections');
  }

  getCollection(collName) {
    return this.getObject(joinpath('/api/collection', collName));
  }

  getItems(collName) {
    return this.getObject(joinpath('/api/collection', collName, 'items'));
  }

  getItem(collName, item) {
    return this.getObject(joinpath('/api/collection', collName, 'item', item));
  }

  getShows(collName) {
    return this.getItems(collName);
  }

  async getShowById(collName, show) {
    const theShow = await this.getItem(collName, show);
    return updateShow(this.url, theShow);
  }

  async getShow(collName, show) {
    const theShow = await this.getItem(collName, show);
    return updateShow(this.url, theShow);
  }

  getMovies(collName) {
    return this.getItems(collName);
  }

  async getMovie(collName, movie) {
    const theMovie = await this.getItem(collName, movie);
    return updateMovie(this.url, theMovie);
  }
}
