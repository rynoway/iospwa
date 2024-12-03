import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// const updateSW = registerSW({
//   onNeedRefresh() {
//     // 當有新版本時顯示更新提示
//     if (confirm('New content available. Reload?')) {
//       updateSW()
//     }
//   },
//   onOfflineReady() {
//     console.log('App ready to work offline')
//   }
// })

const app = createApp(App)
app.mount('#app')
