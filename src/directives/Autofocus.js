// This directive makes the element in the page auto-focus on mount.
//
// On mount and on update it will check if there is no focussed
// element and if not, it will focus the element. We also keep
// a global reference to the last active autofocus element.
//
// There are also event listeners that detect if focus is lost
// to the BODY element. If so, it tries to set focus back to the
// latest auto-focus element. This is especially important for
// keyboard-only (or DPAD-only) navigation.

var savedAutofocus;
var savedSelector;

function doFocus(el, selector, why) {
  if (!selector && el === document.activeElement) {
    console.log('v-autofocus: ', why, ': already is active element', document.activeElement);
    return;
  }

  if (selector && el !== document.activeElement && el.contains(document.activeElement)) {
    console.log('v-autofocus: ', why, ': already contains active element', document.activeElement);
    return;
  }

  let elem;
  if (!selector) {
    elem = el;
  } else {
    elem = el.querySelector(':scope ' + selector);
    if (!elem)
      console.log('v-autofocus: ', why, `: not found: [${selector}]`, el);
  }
  if (elem) {
    console.log('v-autofocus: ', why, ': focussing ', elem);
    elem.focus();
    savedAutofocus = elem;
    savedSelector = selector;
  }
  return elem;
}

function mounted(el, binding, hook) {

  if (!el.isConnected)
    return;

  let selector = binding.value;
  if (typeof binding.value === 'object') {
    if (!binding.value.v_if && !binding.value.vIf) {
      return;
    }
    selector = binding.value.selector;
  }

  if (hook !== 'mounted') {
    if (document.activeElement === document.body) {
      setTimeout(() => doFocus(el, selector, hook), 0);
    }
    savedAutofocus = el;
    savedSelector = selector;
    return;
  }

  // On mount, focus.
  setTimeout(() => doFocus(el, selector, 'mounted'), 0);

  // On focus, focus on the internal element.
  function onFocus() {
    if (selector) {
      doFocus(el, selector, 'focus on selector');
    }
  }
  el.addEventListener('focus', onFocus);

  // Make this element autofocus.
  el.setAttribute('autofocus', true);
}

function unmounted(el) {
  // On umount, set curAutofocus back to what it was.
  if (el.contains(savedAutofocus)) {
    savedAutofocus = null;
    savedSelector = null;
  }
}

export const Autofocus = {
  mounted: (el, binding) => mounted(el, binding, 'mounted'),
  updated: (el, binding) => mounted(el, binding, 'updated'),
  unmounted,
}

export function AutofocusInit() {

  // If the body EVER gets focus, refocus on an autofocus element.
  function onBodyFocus() {

    // First try to get back to the last autofocus.
    if (savedAutofocus) try {
      if (savedAutofocus.isConnected) {
        console.log('body-focus: try', savedAutofocus);
        if (doFocus(savedAutofocus, savedSelector, 'body-focus')) {
          console.log('body-focus: recovered');
          return;
        }
        console.log('body-focus: failed to recover savedAutofocus');
      }
    } catch(e) {
      console.log('body-focus: tried last known autofocus: ', e);
    }

    // Nope, find the first autofocus and use that.
    let elems = document.querySelectorAll('[autofocus]');
    for (let i = 0; i < elems.length; i++) {
      const el = elems[i];
      // Must be visible.
      const rect = el.getBoundingClientRect();
      if (rect.top > document.body.clientHeight ||
          rect.left > document.body.clientWidth ||
          rect.bottom < 0 ||
          rect.right < 0 ||
          rect.width === 0 ||
          rect.height === 0) {
        continue;
      }
      var style = window.getComputedStyle(el);
      if (style.display === 'none' ||
          style.visibility === 'hidden' ||
          !style.opacity) {
        continue;
      }
      // should be good enough to recover.
      console.log('body-focus: recovering, re-focussing on', el);
      setTimeout(() => {
        el.focus();
      }, 0);
      return;
    }
    console.log('body-focus: failed to recover');
  }

  // No 'focus' or 'focusin' event gets fired when the focus is lost
  // to the body, but there is a 'focusout' event and at that point
  // document.activeElement can sometimes point at the BODY, likely
  // the document is 'between focussed elements'. So check at the
  // next tick if the body is the active element.
  var refocussing = false;
  document.addEventListener('focusout', (ev) => {
    setTimeout(() => {
      if (!refocussing && document.activeElement === document.body) {
        refocussing = true;
        onBodyFocus();
        refocussing = false;
      }
    }, 20);
  });

  // Prevent default action on body for navigation keys.
  document.body.addEventListener('keydown', (ev) => {
    switch (ev.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Enter':
      case 'Tab':
        console.log('body: preventing default for', ev.key);
        ev.preventDefault();
        break;
    }
  });

  // Catch any key early and if we lost focus, refocus.
  document.body.addEventListener('keydown', () => {
    if (document.activeElement === document.body) {
      onBodyFocus();
    }
  }, true);
}