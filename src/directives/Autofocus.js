// This directive makes sure that there's always an element that has the
// focus on a page. It checks for that on mount, at every update, and
// every time it receives the 'focusout' event.
//
// If there's no focussed element, one of the elements in its scope that
// is marked with a "v-focus" attribute will receive focus.
//
// If the modifier 'strict' is set, then it's not enough that some
// element on the page has focus, it has to be in this scope - if not,
// an element in the scope will be given focus.
//
// See the "v-focus" attribute for more.
//

/* eslint no-console: 0 */
/* eslint no-continue: 0 */

const DBG = false;

function updateFocus(el, what, lostFrom, lostTo) {
  if (!el.isConnected || !isActive(el)) {
    return;
  }

  // First, check if there's an inner v-autofocus.
  if (lostFrom && lostFrom.isConnected) {
    let elem = lostFrom;
    while (elem && elem !== el) {
      if (elem.dataset.autofocus != null && elem.dataset.autofocus === '') {
        // It does have to have focusable autofocus elements.
        if (elem.querySelector(':scope div [data-autofocus]')) {
          return;
        }
      }
      elem = elem.parentNode;
    }
  }

  // Check if lostTo is in scope.
  if (lostTo == null) {
    lostTo = document.activeElement;
  }
  if (!isStrict(el)) {
    // as long as any element has focus, it's fine.
    if (lostTo !== document.body) {
      return;
    }
  } else {
    // the element needs to be in scope.
    let elem = lostTo;
    while (elem) {
      if (elem === el) {
        return;
      }
      elem = elem.parentNode;
    }
  }
  if (DBG) console.log('Autofocus: updateFocus: need refocus, lost focus to', lostTo);

  // Right, we need to (re-) focus.
  // First, find all elements with a data-autofocus attribute.
  const elems = el.querySelectorAll(':scope [data-autofocus]');
  let toFocus = { prio: -1 };
  for (let elem of elems) {
    let prio = 0;
    if (elem.dataset.autofocus) {
      if (DBG) console.log('Autofocus: candidate', elem, elem.dataset.autofocus);
      // It's in the form of { prio: 3, selector: 'input' }
      const ds = JSON.parse(elem.dataset.autofocus);
      prio = ds.prio;
      if (ds.selector) {
        elem = elem.querySelector(`:scope ${ds.selector}`);
      }
    }
    if (prio > toFocus.prio) {
      toFocus.prio = prio;
      toFocus.elem = elem;
    }
  }

  // If we did find one, focus on it.
  if (toFocus.elem) {
    let elem = toFocus.elem.querySelector(
      ':is([tabindex]:not([tabindex="-1"]), ' +
      '    input:not([disabled]):not([tabindex="-1"]))'
    );
    if (!elem) {
      elem = toFocus.elem;
    }
    if (DBG) console.log('Autofocus: (re)focussing on', elem);
    elem.focus();
  }
}

function isActive(el) {
  if (!el.__autofocus || el.__autofocus.active == null) {
    return true;
  }
  return el.__autofocus.active;
}

function isStrict(el) {
  el && el.__autofocus && el.__autofocus.strict;
}

function onFocusOut(ev) {
  const el = ev.currentTarget;
  const lostFrom = ev.target;
  const lostTo = ev.relatedTarget;
  // If the element losing focus is leaving the DOM, then we need to wait
  // one tick to prevent it from being selected as a focussable candidate.
  setTimeout(() => updateFocus(el, 'focusout', lostFrom, lostTo), 0);
}

function updated(el, binding) {
  const val = binding.value;
  if (val !== binding.oldValue && val !== undefined) {
    el.__autofocus ||= {};
    el.__autofocus.active = val ? true : false;
  }
  updateFocus(el, 'updated');
}

function mounted(el, binding) {
  el.dataset.autofocus = '';
  if (binding.value !== undefined) {
    el.__autofocus ||= {};
    el.__autofocus.active = binding.value ? true : false;
  }
  if (binding.modifiers.strict) {
    el.__autofocus ||= {};
    el.__autofocus.strict = true;
  }
  el.addEventListener('focusout', onFocusOut);
  setTimeout(() => updateFocus(el, 'mounted'), 0);
}

function unmounted(el, binding) {
  el.removeEventListener('focusout', onFocusOut);
}

export default {
  mounted,
  unmounted,
  updated,
};
