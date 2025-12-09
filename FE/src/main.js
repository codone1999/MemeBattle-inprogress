import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { imageFallback } from './directives/imageFallback'

const app = createApp(App)

app.use(router)

// Register global directive for image fallback
app.directive('image-fallback', imageFallback)

app.mount('#app')
