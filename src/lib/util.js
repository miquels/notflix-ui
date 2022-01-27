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

export function hhmmss(seconds) {
  const d = new Date(seconds * 1000).toISOString();
  if (seconds >= 3600) {
    return d.substr(11, 8);
  }
  return d.substr(14, 5);
}

function numberWidth(num, w) {
  let s = `${num}`;
  while (s.length < w) {
    s = `0${s}`;
  }
  return s;
}

export function hhmm(minutes) {
  if (Number.isNaN(Number(minutes))) {
    return minutes;
  }
  minutes = parseInt(minutes, 10);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const m = minutes % 60;
  const h = Math.floor(minutes / 60);
  return `${h}h${numberWidth(m, 2)}m`;
}

export function s0xe0x(season, episode) {
  return `S${numberWidth(season, 2)}E${numberWidth(episode, 2)}`;
}

export function sxe(season, episode) {
  return `${numberWidth(season, 2)}x${numberWidth(episode, 2)}`;
}

export function addStyleSheetRule(selectorObj, rulesObj) {
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
