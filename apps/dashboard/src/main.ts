import { createApp } from 'vue'
import { cesiumPlugin } from '@cesium-eco/core'
import App from './App.vue'
import { router, pinia } from '@cesium-eco/app'
import './styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(cesiumPlugin)

app.mount('#app')
