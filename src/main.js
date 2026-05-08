// main.ts o main.js
import './assets/main.css'
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import html2pdf from 'html2pdf.js';

// Hacer html2pdf disponible globalmente
window.html2pdf = html2pdf;

const app = createApp(App);

app.use(createPinia()); 
app.use(router);

app.mount('#app');