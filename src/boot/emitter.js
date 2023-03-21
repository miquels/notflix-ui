import { boot } from 'quasar/wrappers';
import mitt from 'mitt';

export default boot(({ app }) => {
  app.use({
    install: () => {
      const emitter = mitt();
      app.provide('emitter', emitter);
      window.__emitter = emitter;
    },
  });
});
