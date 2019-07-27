import Vue from 'vue'
import App from './App.vue'
import router from './router'

import Toasted from "vue-toasted";
Vue.use(Toasted, {
  position: "bottom-left",
  duration: 8000,
  className: ['toast-css']
})

import ToggleButton from 'vue-js-toggle-button'
Vue.use(ToggleButton)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')