// Common utilities for tvshows and episodes.

function _getLastEpisode(seasons, doExtras) {
  for (let sidx = seasons.length - 1; sidx >= 0; sidx -= 1) {
    const season = seasons[sidx];
    if ((doExtras && season.seasonno !== 0) ||
        (!doExtras && season.seasonno === 0)) {
      continue;
    }
    for (let eidx = season.episodes.length - 1; eidx >= 0; eidx -= 1) {
      const episode = season.episodes[eidx];
      if (episode.seen && episode.seen.currentTime > 0) {
        return [season, episode];
      }
    }
  }
  return null;
  if (doExtras) {
    return null;
  }
  let season = seasons[0];
  return [ season, season.episodes[0] ];
}

// Find the last episode that was watched.
// If no episodes were watched yet, return the very first episode.
export function getLastEpisode(seasons) {
  // First, find the last watched episode without including extras.
  let res = _getLastEpisode(seasons, false);
  if (res) {
    return res;
  }

  // Ok, we might have been watching extras.
  res = _getLastEpisode(seasons, true);
  if (res) {
    return res;
  }

  // Just return the first episode of the first season, skip the extras.
  let season = seasons[0];
  if (season.seasonno === 0 && seasons.length > 1) {
    season = seasons[1];
  }
  return [ season, season.episodes[0] ];
}

// Find the next episode, or count the number of next episodes.
function _getNextEpisode(seasons, startSeason, startEpisode, doCount) {
  let count = 0;
  let startEpisodeNo = startEpisode.episodeno;
  let startSeasonNo = startSeason.seasonno;
  for (let season of seasons) {
    if ((startSeasonNo === 0 && season.seasonno !== 0) ||
        season.seasonno < startSeason.seasonno) {
      continue;
    }
    for (let episode of season.episodes) {
      if (startEpisodeNo != null) {
        if (episode.episodeno === startEpisodeNo) {
          startEpisodeNo = null;
        }
        continue;
      }
      if (!doCount) {
        return [ season, episode ];
      }
      count += 1;
    }
    startEpisodeNo = null;
  }
  return doCount ? count : null;
}

// Find the next episode.
export function getNextEpisode(seasons, startSeason, startEpisode) {
  return _getNextEpisode(seasons, startSeason, startEpisode, false);
}

// Get the number of new episodes.
// Also counts the current episode if it's watched for < 50%
//
// If there are no unwatched episodes, but the current episode
// is unwatched < 90% returns '0'. Otherwise 'null'.
export function getNewEpisodeCount(seasons) {
  const last = getLastEpisode(seasons);
  if (last === null) {
    return null;
  }
  const [ se, ep ] = last;
  let count = 0;
  if (ep.seen) {
    const progress = ep.seen.currentTime / ep.seen.duration;
    if (progress < 0.5) {
      count += 1;
    }
  } else {
    count += 1;
  }
  count += _getNextEpisode(seasons, se, ep, true);
  if (count === 0) {
    const state = episodeState(ep);
    if (!state.resume) {
      count = null;
    }
  }
  return count;
}

// Make a guess if we:
//
// 1. have to play from the start
// 2. have to resume the episode
// 3. can play the next episode.
//
// 2 and 3 can both be true.
//
export function episodeState(episode) {
  if (!episode || !episode.seen) {
    return { play: episode != null, resume: false, next: false };
  }
  const seen = episode.seen;
  const progress = seen.currentTime / seen.duration;
  const secsLeft = seen.duration - seen.currentTime;
  const play = seen.currentTime < 5;
  const resume = seen.currentTime >= 5 && (progress < 0.95 || secsLeft >= 60);
  const next = progress >= 0.80 || secsLeft < 300;
  return { play, resume, next };
}
