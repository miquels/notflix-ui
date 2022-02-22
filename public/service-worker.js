// Minimal service worker that doesn't actually do anything.

console.log('service-worker.js: loaded, adding "fetch" event listener');
self.addEventListener('fetch', function() {
    return;
});
