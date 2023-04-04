/*
 *  util  Utility functions.
 *
 *  util.joinpath()
 *  util.isMobile()
 *  util.isWebkit()
 *  util.debounce
 *  util.hhmmss(seconds)
 *  util.hhmm(minutes)
 *  util.sxe
 *  util.scrollbarWidth
 *  util.addPrettyScrollBars
 *  util.decodeSE
 *  util.encodeSE
 *  util.cyrb53
 */

import { watch } from 'vue';

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

export function isMobile() {
  return (window.orientation !== undefined);
}

export function isWebkit() {
  return navigator.userAgent.match(/webkit/i) !== null;
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

export function hhmmss(seconds) {
  const d = new Date(seconds * 1000).toISOString();
  if (seconds >= 3600) {
    return d.substr(11, 8);
  }
  return d.substr(14, 5);
}

function numberWidth(num, w) {
  return num.toString().padStart(w)
}

export function hhmm(minutes) {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) {
    return minutes;
  }
  if (mins < 60) {
    return `${mins}m`;
  }
  const m = mins % 60;
  const h = Math.floor(mins / 60);
  return `${h}h${numberWidth(m, 2)}m`;
}

export function sxe(season, episode) {
  return `${numberWidth(season, 2)}x${numberWidth(episode, 2)}`;
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

function addStyleSheetRule(selectorObj, rulesObj) {
  let rules = '';
  for (const [key, value] of Object.entries(rulesObj)) {
    rules += `${key}: ${value};`;
  }
  let selector = selectorObj;
  if (typeof selectorObj === 'object') {
    selector = selectorObj.join(' ');
  }
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  styleEl.type = 'text/css';
  styleEl.sheet.insertRule(`${selector} { ${rules} }`, 0);
}

export function addPrettyScrollBars() {
  addStyleSheetRule('*::-webkit-scrollbar', {
    width: '12px',
    height: '12px',
  });
  addStyleSheetRule('*::-webkit-scrollbar-thumb', {
    background: '#999',
    'border-radius': '8px',
    border: '2px solid #333',
  });
  addStyleSheetRule('*::-webkit-scrollbar-track', {
    background: '#333',
  });
  addStyleSheetRule('*', {
    'scrollbar-width': 'thin',
    'scrollbar-color': '#999 #333',
  });
}

// Decodes: '', 's01', 's01e02'. On no match returns null.
export function decodeSE(seasonEpisode) {
  const re = /^(?:(?:s0*([0-9]+)(?:e0*([0-9]+))?)|)$/;
  const s = (seasonEpisode || '').match(re);
  return s ? {
    season: s[1] || s[1] === '0' ? parseInt(s[1]) : null,
    episode: s[2] || s[2] === '0' ? parseInt(s[2]) : null,
  } : null;
}

export function encodeSE(season, episode) {
  let s = 's' + season.toString().padStart(2, '0');
  s += (episode || episode === 0) ? 'e' + episode.toString().padStart(2, '0') : '';
  return s;
}

export function whenTrue(ref, closure) {
  if (ref === true || (typeof ref === 'object' && ref.value === true)) {
    closure();
    return;
  }
  let done = false;
  watch(ref, (r) => {
    if (r && !done) {
      closure();
      done = true;
    }
  });
}

// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
export const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
