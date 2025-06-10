import { fetchWeatherData } from './weatherService.js';
import { 
  setupUI, 
  updateCurrentWeather, 
  updateHourlyForecast, 
  updateDailyForecast, 
  updateNearbyCities, 
  showErrorPage 
} from '../uiManager.js';

const DEFAULT_CITY = 'Moscow';
let currentCity = DEFAULT_CITY;

export function initWeatherApp() {
    console.log("Module loaded!"); // Проверка загрузки
    setupUI(onCitySearch, onTabSwitch, onGoBack);
    
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getCityNameFromCoords(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                loadWeatherData(DEFAULT_CITY);
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
        loadWeatherData(DEFAULT_CITY);
    }
}

async function loadWeatherData(city, lat, lon) {
    console.log('Loading weather for:', city || `${lat},${lon}`);
    try {
        const weatherData = await fetchWeatherData(city, lat, lon);
        console.log('Received data:', weatherData);
        if (weatherData) {
            currentCity = weatherData.current.name;
            document.getElementById('city-search').value = currentCity;
            
            // Обновляем UI с новыми данными
            updateCurrentWeather(weatherData.current);
            updateHourlyForecast(weatherData.forecast);
            updateDailyForecast(weatherData.forecast);
            updateNearbyCities(weatherData.coords.lat, weatherData.coords.lon);
        }
    } catch (error) {
        console.error('Error loading weather:', error);
        showErrorPage();
    }
}

async function getCityNameFromCoords(lat, lon) {
    try {
        const weatherData = await fetchWeatherData(null, lat, lon);
        if (weatherData) {
            loadWeatherData(weatherData.current.name, lat, lon);
        } else {
            loadWeatherData(DEFAULT_CITY);
        }
    } catch (error) {
        console.error('Error getting city name:', error);
        loadWeatherData(DEFAULT_CITY);
    }
}

function onCitySearch(city) {
    if (city) {
        loadWeatherData(city);
    }
}

function onTabSwitch(tabId) {
    console.log(`Switched to ${tabId} tab`);
}

function onGoBack() {
    loadWeatherData(currentCity);
}

