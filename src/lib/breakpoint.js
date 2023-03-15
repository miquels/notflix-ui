
export default function breakpoint(size) {
  // NOTE: keep breakpoints in sync with src/css/quasar.variables.scss !
  if (size === undefined) {
    size = window.innerWidth;
  }
  if (!isNaN(size)) {
    if (size < 600) return 'xs';
    if (size < 960) return 'sm';
    if (size < 1440) return 'md';
    if (size < 1920) return 'lg';
    return 'xl';
  }

  // NOTE: keep in sync with src/css/quasar.variables.scss !
  switch (size) {
    case 'xs': return 0;
    case 'sm': return 600;
    case 'md': return 960;
    case 'lg': return 1440;
    case 'xl': return 1920;
  }
  return null;
}
