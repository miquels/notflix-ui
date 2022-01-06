import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  app.use({
    install: () => {
      app.config.compilerOptions.isCustomElement = (tag) => tag === 'google-cast-launcher';
    },
  });
});
