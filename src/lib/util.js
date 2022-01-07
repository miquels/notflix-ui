/*
 *  util  Utility functions.
 *
 *  util.joinpath()
 *  util.FullScreen()
 *  util.isFullScreen()
 *  util.cleanURL()
 */

export function joinpath(...args) {
  let ret = [];
  // eslint-disable-next-line
  for (const a in args) {
    let p = args[a];
    if (!p || p === '') {
      // eslint-disable-next-line
      continue;
    }
    if (p.match(/^([a-z]+:|\/)/)) {
      // starts with method: or /
      if (ret.length > 0 && ret[0].match(/^[a-z]+:/)) {
        ret.splice(1);
      } else {
        ret = [];
      }
    }
    if (ret.length > 0) {
      p = p.replace(/^\/+/, '');
    }
    if (a < args.length - 1) {
      p = p.replace(/\/+$/, '');
    }
    ret.push(p);
  }
  return ret.join('/');
}

function twoDigits(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function hhmmss(tm, doHour) {
  if (tm === null || tm === undefined) {
    return '-';
  }
  const h = Math.floor(tm / 3600);
  const m = Math.floor((tm % 3600) / 60);
  const s = Math.floor(tm % 60);
  if (doHour || h > 0) {
    return `${twoDigits(h)}:${twoDigits(m)}:${twoDigits(s)}`;
  }
  return `${twoDigits(m)}:${twoDigits(s)}`;
}

export function isMobile() {
  return (window.orientation !== undefined);
}

export function isWebkit() {
  return navigator.userAgent.match(/webkit/i) !== null;
}

// To prevent redirects, remove double slashes,
// and make sure the url ends in / for dirs.
export function cleanURL(url, isDir) {
  const s = /^([a-z]+:\/\/|\/\/|)(.*)/.exec(url);
  if (s) {
    url = s[1] + s[2].replace(/\/+/g, '/');
  }
  if (isDir && !url.match(/\/$/)) {
    url += '/';
  }
  return url;
}

// inspired by
// https://davidwalsh.name/detect-scrollbar-width
export function scrollbarWidth(className) {
  // Create the measurement node
  const scrollDiv = document.createElement('div');
  scrollDiv.style.width = '100px';
  scrollDiv.style.height = '100px';
  scrollDiv.style.overflow = 'scroll';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';
  if (className) {
    scrollDiv.className = className;
  }
  document.body.appendChild(scrollDiv);
  // console.log('scrolldiv:', scrollDiv);

  // Get the scrollbar width
  const width = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  // Delete the DIV
  document.body.removeChild(scrollDiv);

  return width;
}

// https://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate) {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(args);
  };
}
