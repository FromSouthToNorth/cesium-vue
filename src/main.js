import { createApp } from 'vue'
import App from './App.vue'

import { createPinia } from 'pinia'

import './style/reset.css'
import './style/index.css'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')
