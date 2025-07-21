import { createWebHistory, createRouter } from 'vue-router'

import cesium from '@/view/cesium.vue'
import cesium3d from '@/view/cesium3d.vue'

const routes = [
  { path: '/', component: cesium },
  { path: '/cesium3d', component: cesium3d },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
