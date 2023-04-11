import { boot } from 'quasar/wrappers'
import Lrud from '../components/Lrud.vue'
import Focus from '../directives/Focus.js'
import Autofocus from '../directives/Autofocus.js'

export default boot(async ({ app }) => {
  app.component('lrud', Lrud)
  app.directive('autofocus', Autofocus);
  app.directive('focus', Focus);
})
