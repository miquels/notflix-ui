//
// boot file to read /config.json dynamically.
// 404 not found is OK (for now).
//
export default async ({ store }) => {
  const response = await fetch('/config.json', {
    method: 'GET',
    mode: 'same-origin',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'manual',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) {
    if (response.status === 404) {
      return;
    }
    throw new Error(`boot/config;js: GETting /config.json: error ${response.status}`);
  }
  const config = await response.json();
  store.commit('externalConfig', config);
};
