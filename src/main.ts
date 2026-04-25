import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { cesiumPlugin } from './utils/cesium-init'
import '@/styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(cesiumPlugin)

app.mount('#app')
