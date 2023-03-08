<script>
import {
  onMounted,
  withDirectives,
} from 'vue';
import { useQuasar } from 'quasar';

// If there is a label attached to the element, use that.
function label_for(el) {
  let outer_el = el;
  if (el.id) {
    let id = el.id;
    const label = document.querySelector(`[for="${id}"]`);
    if (label) {
      outer_el = label;
    }
  }
  return outer_el;
}

class FocussedElem {
  constructor(el) {
    const rect = label_for(el).getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    this.el = el;
    let left = rect.left;
    let top = rect.top;
    if (width < 16) {
      left -= (16 - width);
      width = 16;
    }
    if (height < 16) {
      top -= (16 - height);
      height = 16;
    }
    this.x = left + width / 2;
    this.y = top + height / 2;
    this.factor = height / width;
    // console.log('focussed-elem', this);
  }

  // Spational navigation.
  // Calculate the direction elem is in relative to ourself.
  // We use the LRUD 'frustrum' algorithm proposed by
  // https://netflixtechblog.com/pass-the-remote-user-input-on-tv-devices-923f6920c9a8
  direction(rect) {

    // get the middle coordinates of elem's bounding rectangle.
    const x2 = rect.left + (rect.right - rect.left) / 2;
    const y2 = rect.top + (rect.bottom - rect.top) / 2;

    // horizontal distance between 'this' and 'elem'.
    const dx = this.x - x2;

    // There is a line going through (this.left, this.bottom) <=> (this.right, this.top).
    // For a certain x position of the line, we can calculate where y is.
    // Then check if the point is above that virtual line.
    const liney1 = this.y + this.factor * dx;
    const above1 = y2 <= liney1;

    // Ditto for the line going through (this.left, this.top) <=> (this.right, this.bottom).
    const liney2 = this.y - this.factor * dx;
    const above2 = y2 <= liney2;

    // Now we can calculate if 'rect' is left, right, up or down relative to this.
    let dir;
    if (above1 && above2) dir = 'up';
    if (above1 && !above2) dir = 'left';
    if (!above1 && !above2) dir = 'down';
    if (!above1 && above2) dir = 'right';

    return dir;
  }

  // Calculate the distance from 'this' to rect.
  distance(rect) {
    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    let a = Math.abs(this.x - x);
    let b = Math.abs(this.y - y);
    return Math.sqrt(a ** 2 + b ** 2);
  }

  // See if 'el' is left / right / up / down relative to 'this'.
  // then update nearest if 'el' is the nearest element in that direction.
  update_nearest(dir, el) {
    const r2 = label_for(el).getBoundingClientRect();

    if (dir != this.direction(r2)) {
      // console.log('wrong dir', r2, this.direction(r2), el);
      return;
    }
    const dist = this.distance(r2);
    // console.log('distance', dist, el);
    if (!this.dist || dist < this.dist) {
      this.to = el;
      this.dist = dist;
    }
  }

  // Handle keyboard navigation from 'this' to another focusable element.
  navigate(ev, dir, elems) {

    // Loop over all focusable child elements and find the nearest.
    for (const e2 of elems) {
      if (this.el !== e2) {
        const tabindex = e2.getAttribute('tabindex');
        if (tabindex !== '-1' || e2.tagName !== 'INPUT') {
          this.update_nearest(dir, e2);
        }
      }
    }

    // Now we _have_ the nearest!
    //console.log('nearest', this.to);
    return this.to;
  }
}

const keymap = {
  'ArrowLeft': [ 'L', 'left' ],
  'ArrowRight': [ 'R', 'right' ],
  'ArrowUp': [ 'U', 'up' ],
  'ArrowDown': [ 'D', 'down' ],
  'Enter': [ 'E', 'enter' ],
};

var hasMenuOpen = false;

export default {
  name: 'Lrud',
  props: {
    'steal-keys-outside': Boolean,
    'no-nav-inside': Boolean,
    'no-scroll-into-view': Boolean,
  },
  setup (props, { slots }) {
    const stealKeysOutside = props.stealKeysOutside;
    const noNavInside = props.noNavInside;
    const noScrollIntoView = props.noScrollIntoView;

    const keys = props.keys || 'LRUDE';
    let hasMenu = false;
    let handler;

    const quasar = useQuasar();

    // custom directive.
    const directive = {

      // Register keyboard handler.
      mounted (el) {
        handler = (ev) => {

          //console.log('keypress:', ev);

          // The 'back' button on android tv remotes has been mapped to
          // escape. So if a menu is open, close it, otherwise do the
          // history go(-1) thing.
          if (quasar.platform.is.tv) {
            if (ev.key === 'Escape') {
              if (hasMenuOpen) {
                return;
              } else {
                ev.stopPropagation();
                console.log('would go back');
                // history.go(-1);
              }
              return;
            }
          }

          // for LRUD/Enter never choose the default action.
          const m = keymap[ev.key];
          if (m && !ev.defaultPrevented) {
            ev.preventDefault();
          }

          // Check if we should handle this key.
          if (!m || keys.indexOf(m[0]) < 0) {
            return;
          }
          const key = m[1];

          // Enter is click.
          if (key === 'enter') {
            if (!noNavInside) {
              //console.log('enter - click eventphase is', ev.eventPhase);
              ev.target.click();
              ev.stopPropagation();
            } else {
              //console.log('enter - ignoring');
            }
            return;
          }

          if (hasMenu && hasMenuOpen && (key == 'up' || key == 'down')) {
            // console.log('hasMenu up/down');
            return;
          }

          // Bubble through the elements until we Find the focusable element.
          let target = ev.target;
          while (!target.matches(':is([tabindex="0"], button, input, a[href])')) {
            target = target.parentElement;
            if (!target) {
              console.log('target not found from', ev.target);
              return;
            }
          }

          // Find all focusable child elements in this scope.
          const elems = Array.from(
            el.querySelectorAll(':scope :is([tabindex="0"], button, input, a[href])')
          );

          // Find the nearest in the direction of the arrowkey pressed.
          const fe = new FocussedElem(target);
          const dest = fe.navigate(ev, key, elems);

          // Found nearest, focus and stop.
          if (dest && !noNavInside) {
            ev.stopPropagation();
            // QSelect doesn't close the menu when it loses focus,
            // so fire an 'Escape' keyup event if the menu is open.
            if (hasMenuOpen) {
              const esc = new KeyboardEvent('keyup', {
                'key': 'Escape',
                'code': 'Escape',
                'keyCode': 27,
              });
              ev.target.dispatchEvent(esc, { bubbles: true });
            }
            dest.focus({ preventScroll: true });
            if (!noScrollIntoView) {
              dest.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
          }

          // There's no next focussable element, and stealKeysOutside is set.
          //
          // Do not propagate the keyboard event to the inner elements
          // (we're in the capturing phase!) but dispatch a similar event from
          // the target, so that an outer <Lrud> can catch the event.
          if (stealKeysOutside && !dest) {
            const cloned_ev = new KeyboardEvent('keydown_cloned', ev);
            ev.stopPropagation();
            ev.target.dispatchEvent(cloned_ev, { bubbles: true });
          }
        };

        el.addEventListener('keydown', handler, stealKeysOutside);
        if (!stealKeysOutside)
          el.addEventListener('keydown_cloned', handler);
      },

      // Unregister keyboard handler.
      unmounted (el) {
        el.removeEventListener('keydown', handler, stealKeysOutside);
        el.removeEventListener('keydown_cloned', handler);
      },
    };

    // return the node in the first slot, with custom directive applied.
    return () => {
      let node = slots.default && slots.default()[0];
      if (node) {
        node = withDirectives(node, [
          [directive]
        ]);
        if (typeof node.type === 'object' && node.type.name === 'QSelect') {
          hasMenu = true;
          node.props.onPopupShow = () => { hasMenuOpen = true; };
          node.props.onPopupHide = () => { hasMenuOpen = false; };
        }
      }
      return node;
    }
  }
}
</script>
