// Need to install a minimal service worker so that the
// browser knows this is a PWA.
if ('serviceWorker' in navigator) {
  console.log('boot/pwa: registering service worker');
  navigator.serviceWorker.register('service-worker.js')
    .then((s) => console.log('service worker registered:', s))
    .catch((e) => console.log('error registering service worker:', e))
}
