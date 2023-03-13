import { boot } from 'quasar/wrappers'
import Lrud from '../components/Lrud.vue'
import LrudFocusEnter from '../components/LrudFocusEnter.vue'
import { Autofocus, AutofocusInit } from '../directives/Autofocus.js'

export default boot(async ({ app }) => {
  app.component('lrud', Lrud)
  app.component('lrud-focus-enter', LrudFocusEnter)
  app.directive('autofocus', Autofocus)
  AutofocusInit()
})
