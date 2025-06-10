import { initWeatherApp } from './modules/weatherApp.js';
import { setupUI } from './modules/uiManager.js';

document.addEventListener('DOMContentLoaded', () => {
    setupUI();
    initWeatherApp(); 
});