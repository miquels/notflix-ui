/*
 * api.js Talk to the API.
 *
 * import { useApi } from 'lib/api.js'
 * const api = useApi();
 *
 * const collections = api.getCollections();
 * const collection = api.getCollection('collectionId');
 *
 * const shows = api.getItems(collectionId)
 * const show = api.getShow(collectionId, showId)
 *
 * const movies = api.getItems(collectionId)
 * const movie = api.getMovie(collectionId, movieId)
 */

import { reactive } from 'vue';
import { useStore } from 'vuex';
import { joinpath, encodeSE } from './util.js';
import { getNewEpisodeCount } from './tvshow.js';
import * as localforage from 'localforage';

// XXX
window.localforage = localforage;

// set max cache age to one hour.
const MAX_CACHE_AGE = 3600 * 1000;


// Vue composition-api style.
export function useApi() {
  return new API();
}

export default class API {
  constructor() {
    // Make this a singleton.
    if (API._instance) {
      return API._instance;
    }
    API._instance = this;
    const store = useStore();
    this.store = store;
    this.url = store.state.externalConfig.apiUrl;
    this.objectCache = {};
    this.requestsPending = {};
    this.idCounter = 1;
    this.__favorites = {};
    this.favorites = reactive(this.__favorites);
    this.lastUpdate = 1;
  }

  async _getObjectFromServer(path) {
    const reqUrl = joinpath(this.url, path);
    // console.log('getObj url path req', this.url, path, reqUrl)
    // console.log('DBG: api._getObject: requesting', reqUrl)

    const resp = await fetch(reqUrl, { redirect: 'follow' });
    if (!resp.ok) {
      throw new RangeError(`unexpected HTTP code: ${resp.status}`);
    }
    const obj = await resp.json();

    const updateObj = (theObj) => {
      //
      // Give each object an id, and a timestamp.
      theObj.timestamp = Date.now();
      if (!theObj.id) {
        theObj.id = this.idCounter;
        this.idCounter += 1;
      }

      // Make obj.path absolute.
      if (theObj.baseurl && theObj.path) {
        theObj.path = joinpath(this.url, theObj.baseurl, theObj.path);
        delete theObj.baseurl;
      }
    };

    if (Array.isArray(obj)) {
      obj.forEach(updateObj);
    } else {
      updateObj(obj);
    }

    return obj;
  }

  _getObject(path, noNfo) {

    // If it's in the cache and younger than MAX_CACHE_AGE, use cache.
    // However, if we have cached the 'noNfo' version and this request did
    // _not_ set 'noNfo', then we need to get a full object from the server
    let cached = this.objectCache[path];
    if (cached !== undefined) {
      if (!cached.timestamp || cached.timestamp > Date.now() - MAX_CACHE_AGE) {
        if (!cached._noNfo || noNfo) {
          return Promise.resolve(cached);
        }
      }
    }
    const cacheId = path;

    // If we have a non-noNfo request pending, fine.
    if (!this.requestsPending[path] && noNfo) {
      path += '?nonfo';
    }

    // If there's already a request outstanding, piggy back on that.
    let pending = this.requestsPending[path];
    if (pending !== undefined && pending.length > 0) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    }

    pending = [];
    this.requestsPending[path] = pending;

    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });

      this._getObjectFromServer(path).then((obj) => {
        if (!noNfo || !this.objectCache[cacheId] || !this.objectCache[cacheId]._noNfo) {
          // Object.freeze(obj);
          if (noNfo) {
            obj._noNfo = true;
          }
          this.objectCache[cacheId] = obj;
        }
        while (pending.length > 0) {
          const p = pending.shift();
          p.resolve(obj);
        }
      }).catch((err) => {
        while (pending.length > 0) {
          const p = pending.shift();
          p.reject(err);
        }
      });
    });
  }

  _getItem(collId, item, noNfo) {
    return this._getObject(joinpath('/api/collection', collId, 'item', item), noNfo);
  }

  // Get an array of collections.
  async getCollections() {
    return await this._getObject('/api/collections');
  }

  // Get the details for one collection.
  async getCollection(collId) {
    return await this._getObject(joinpath('/api/collection', collId));
  }

  // Deactivated components lose reactivity. We keep a counter
  // here that updates if anything here updates. The component saves
  // the countervalue when deactivated, and when activated it compares
  // it again with the saved version. If there's a difference, the
  // component has to be reloaded.
  // activated
  apiLastUpdate() {
    return this.lastUpdate;
  }

  async migrateFavorites(items) {
    const names = {};
    if (this.store.state.favorites && !this.__migrated) {
      let updated = false;
      for (let fav of Object.getOwnPropertyNames(store.state.favorites)) {
        const name = fav.replace(/^TV Shows\./, '');
        names[fav] = true;
      }
      for (let item of items) {
        if (names[item.name] || names[item.id]) {
          this.favorites[item.id] = true;
          updated = true;
        }
      }
      if (updated) {
        await localforage.setItem('favorites', this.__favorites);
        this.lastUpdate += 1;
      }
      this.__migrated = true;
      this.store.commit('cleanStore');
    }
  }

  async loadFavorites() {
    if (!this.__favsLoaded) {
      const favs = await localforage.getItem('favorites');
      if (favs) {
        for (let fav of Object.keys(favs)) {
          this.favorites[fav] = true;
        }
      }
      this.__favsLoaded = true;
    }
  }

  // Get all the items of one collection.
  // Note that for tvshows, this will return shallow objects, meaning
  // that there's no details on the episodes.
  async getItems(collId) {
    const items = await this._getObject(joinpath('/api/collection', collId, 'items'));
    if (!items) {
      return [];
    }

    // Set collection id.
    items.forEach((item) => item.collection = collId);

    // Add favorites.
    await this.loadFavorites();
    if (collId === '2') {
      await this.migrateFavorites(items);
    }

    return items;
  }

  // Get a list of genre names and ids.
  async getGenres(collId) {
    return await this._getObject(joinpath('/api/collection', collId, 'genres'));
  }

  // Get a list of genre names.
  async getGenreNames(collId) {
    const list = await this.getGenres(collId);
    const genres = Object.keys(list).filter(name => name !== 'id' && name !== 'timestamp');
    genres.sort();
    return genres;
  }

  async _getShow(collId, showId, noNfo) {
    const show = await this._getItem(collId, showId, noNfo);
    if (!show) {
      return null;
    }
    if (!show._retrievedSeens) {
      const info = await localforage.getItem(`tvshow-${show.id}`);
      if (info && info.seen) {
        for (let season of show.seasons) {
          for (let episode of season.episodes) {
            const sxe = encodeSE(episode.seasonno, episode.episodeno);
            if (info.seen[sxe]) {
              episode.seen = info.seen[sxe];
            }
          }
        }
      }
      show._retrievedSeens = true;
    }
    return show;
  }

  async getShowNewEpisodeCount(collId, showId) {
    const show = await this._getShow(collId, showId, true);
    if (!show.seasons) {
      return null;
    }
    return getNewEpisodeCount(show.seasons);
  }

  // Get tvshow details.
  // Note: this returns a cloned, non-reactive object.
  async getShow(collId, showId) {
    const show = await this._getShow(collId, showId);
    const showClone = JSON.parse(JSON.stringify(show));
    showClone.collection = collId;
    return updateShow(showClone);
  }

  // Get movie details.
  // Note: this returns a cloned, non-reactive object.
  async getMovie(collId, movieId) {
    const movie = await this._getItem(collId, movieId);
    if (!movie) {
      return null;
    }
    if (movie.seen === undefined) {
      const info = await localforage.getItem(`movie-${movie.id}`);
      if (info && info.seen) {
        movie.seen = info.seen;
      } else {
        movie.seen = null;
      }
    }
    const movieClone = JSON.parse(JSON.stringify(movie));
    movieClone.collection = collId;
    return updateMovie(movieClone);
  }

  isFavorite(itemId) {
    if (this.favorites[itemId] === undefined) {
      return null;
    }
    return this.favorites[itemId] === true;
  }

  async setFavorite(itemId, value) {
    await this.loadFavorites();
    if (!value) {
      delete this.favorites[itemId];
    } else {
      this.favorites[itemId] = true;
    }
    await localforage.setItem('favorites', this.__favorites);
    this.lastUpdate += 1;
  }

  // The 'item' here is a PlayerInfo objecs .
  async updateSeen(info, currentTime, duration) {

    // Should not happen, but the Chromecast component sometimes sends
    // an update after the end of the video while its state has been reset.
    if (!duration) {
      return;
    }

    let seen;
    const item = await this._getItem(info.collection, info.id);
    if (!item) {
      return;
    }
    if (info.episode) {
      // Update the 'seen' object in the episode.
      const season = item.seasons.find(s => s.seasonno == info.season);
      const episode = season.episodes.find(e => e.episodeno == info.episode);
      episode.seen = {
        currentTime,
        duration,
      }
      // We also need to update the database.
      // First, see if we have a db entry cached, otherwise read it from the db.
      if (!item._dbcache) {
        item._dbcache = await localforage.getItem(`tvshow-${info.id}`);
        item._dbcache ||= {};
        item._dbcache.seen ||= {};
      }
      item._dbcache.seen[info.seasonEpisode] = episode.seen;
      // And store.
      await localforage.setItem(`tvshow-${info.id}`, item._dbcache);
    } else {
      item.seen = {
        currentTime,
        duration,
      }
      await localforage.setItem(`movie-${info.id}`, { seen: item.seen });
    }
  }
}

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

function updateShow(show) {
  // console.log('updateShow', apiUrl, theShow);
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

function updateMovie(theMovie) {
  const movie = JSON.parse(JSON.stringify(theMovie));
  updateNfo(movie, movie);
  if (movie.banner) movie.banner = joinpath(movie.path, movie.banner);
  if (movie.fanart) movie.fanart = joinpath(movie.path, movie.fanart);
  if (movie.poster) movie.poster = joinpath(movie.path, movie.poster);
  if (movie.video) {
    movie.video = joinpath(movie.path, movie.video);
  }
  return movie;
}
