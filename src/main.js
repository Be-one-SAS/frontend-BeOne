// main.ts o main.js
import './assets/main.css'
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia'; // ✅ IMPORTA ESTO

const app = createApp(App);

app.use(createPinia()); // ✅ USA PINIA
app.use(router);

app.mount('#app');