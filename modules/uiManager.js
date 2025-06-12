import { 
  fetchWeatherData, 
  getWindDirection, 
  REVERSE_GEOCODING_URL,
  API_KEY 
} from './weatherService.js';


let currentCity = 'Moscow';
    // Set up event listeners
    const citySearch = document.getElementById('city-search');
    const searchBtn = document.getElementById('search-btn');
    const tabs = document.querySelectorAll('.tab');
    const goBackBtn = document.getElementById('go-back-btn')

export function setupUI(onCitySearch, onTabSwitch, onGoBack) {
    // Set up event listeners
    // const citySearch = document.getElementById('city-search');
    // const searchBtn = document.getElementById('search-btn');
    // const tabs = document.querySelectorAll('.tab');
    // const goBackBtn = document.getElementById('go-back-btn');
    
    // City search
    searchBtn.addEventListener('click', () => {
        const city = citySearch.value.trim();
        onCitySearch(city);
    });
    
    citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = citySearch.value.trim();
            onCitySearch(city);
        }
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            onTabSwitch(tabId);
        });
    });
    
    // Error page button
    goBackBtn.addEventListener('click', onGoBack);
}

export function updateCurrentWeather(data) {
    // Update city name
    document.getElementById('current-city').textContent = `${data.name}, ${data.sys.country}`;
    
    // Update date
    const date = new Date(data.dt * 1000);
    document.getElementById('current-date').textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update weather icon and description
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('current-weather-icon').src = iconUrl;
    document.getElementById('current-weather-icon').alt = data.weather[0].description;
    document.getElementById('current-description').textContent = data.weather[0].description;
    
    // Update temperature
    document.getElementById('current-temp').textContent = Math.round(data.main.temp);
    document.getElementById('current-feels-like').textContent = Math.round(data.main.feels_like);
    
    // Update sunrise/sunset
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    
    document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset').textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Calculate daylight duration
    const daylightMs = sunset - sunrise;
    const daylightHours = Math.floor(daylightMs / (1000 * 60 * 60));
    const daylightMinutes = Math.floor((daylightMs % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('daylight').textContent = `${daylightHours}h ${daylightMinutes}m`;
}

export function updateHourlyForecast(data) {
    const hourlyContainer = document.getElementById('hourly-container');
    hourlyContainer.innerHTML = '';
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Filter forecasts for the rest of today
    const todayForecasts = data.list.filter(item => {
        const forecastDate = new Date(item.dt * 1000);
        return forecastDate.getDate() === now.getDate() && 
               forecastDate.getHours() >= currentHour;
    });
    
    // Add current weather as the first hourly forecast
    const currentWeatherItem = {
        dt: now.getTime() / 1000,
        main: {
            temp: data.list[0].main.temp,
            feels_like: data.list[0].main.feels_like
        },
        weather: data.list[0].weather,
        wind: data.list[0].wind
    };
    
    todayForecasts.unshift(currentWeatherItem);
    
    // Create hourly cards
    todayForecasts.forEach(item => {
        const forecastDate = new Date(item.dt * 1000);
        const time = forecastDate.toLocaleTimeString([], { hour: '2-digit' });
        
        const card = document.createElement('div');
        card.className = 'hourly-card';
        
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        
        card.innerHTML = `
            <div class="time">${time}</div>
            <img src="${iconUrl}" alt="${item.weather[0].description}">
            <div class="temp">${Math.round(item.main.temp)}°C</div>
            <div class="feels-like">Feels like: ${Math.round(item.main.feels_like)}°C</div>
            <div class="wind">Wind: ${Math.round(item.wind.speed)} m/s, ${getWindDirection(item.wind.deg)}</div>
        `;
        
        hourlyContainer.appendChild(card);
    });
}

export function updateDailyForecast(data) {
    const dailyContainer = document.getElementById('daily-container');
    dailyContainer.innerHTML = '';
    
    // Group forecasts by day
    const dailyForecasts = {};
    const now = new Date();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString();
        
        if (!dailyForecasts[dateStr]) {
            dailyForecasts[dateStr] = [];
        }
        
        dailyForecasts[dateStr].push(item);
    });
    
    // Get the next 5 days (including today)
    const forecastDays = Object.keys(dailyForecasts).slice(0, 5);
    
    // Create daily cards
    forecastDays.forEach((day, index) => {
        const dayDate = new Date(day);
        const dayForecasts = dailyForecasts[day];
        
        // Calculate average temp for the day
        const avgTemp = dayForecasts.reduce((sum, item) => sum + item.main.temp, 0) / dayForecasts.length;
        
        // Find the most common weather condition
        const weatherCounts = {};
        dayForecasts.forEach(item => {
            const condition = item.weather[0].main;
            weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
        });
        
        const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
            weatherCounts[a] > weatherCounts[b] ? a : b
        );
        
        const weatherIcon = dayForecasts.find(item => 
            item.weather[0].main === mostCommonWeather
        ).weather[0].icon;
        
        const card = document.createElement('div');
        card.className = `daily-card ${index === 0 ? 'selected' : ''}`;
        card.dataset.date = day;
        
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="day">${index === 0 ? 'Today' : dayName}</div>
            <div class="date">${formattedDate}</div>
            <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" alt="${mostCommonWeather}">
            <div class="temp">${Math.round(avgTemp)}°C</div>
            <div class="description">${mostCommonWeather}</div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.daily-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            updateSelectedDayForecast(dayForecasts, dayDate);
        });
        
        dailyContainer.appendChild(card);
    });
    
    // Show hourly forecast for today by default
    if (forecastDays.length > 0) {
        updateSelectedDayForecast(dailyForecasts[forecastDays[0]], new Date(forecastDays[0]));
    }
}

function updateSelectedDayForecast(forecasts, date) {
    const selectedHourlyContainer = document.getElementById('selected-hourly-container');
    selectedHourlyContainer.innerHTML = '';
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    document.getElementById('selected-day-title').textContent = 
        `${dayName}, ${formattedDate} - Hourly Forecast`;
    
    forecasts.forEach(item => {
        const forecastDate = new Date(item.dt * 1000);
        const time = forecastDate.toLocaleTimeString([], { hour: '2-digit' });
        
        const card = document.createElement('div');
        card.className = 'hourly-card';
        
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        
        card.innerHTML = `
            <div class="time">${time}</div>
            <img src="${iconUrl}" alt="${item.weather[0].description}">
            <div class="temp">${Math.round(item.main.temp)}°C</div>
            <div class="feels-like">Feels like: ${Math.round(item.main.feels_like)}°C</div>
            <div class="wind">Wind: ${Math.round(item.wind.speed)} m/s, ${getWindDirection(item.wind.deg)}</div>
        `;
        
        selectedHourlyContainer.appendChild(card);
    });
}

export async function updateNearbyCities(lat, lon) {
    try {
        const response = await fetch(`${REVERSE_GEOCODING_URL}?lat=${lat}&lon=${lon}&limit=5&appid=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const nearbyContainer = document.getElementById('nearby-container');
        nearbyContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            nearbyContainer.innerHTML = '<p>No nearby cities found.</p>';
            return;
        }
        
        // Filter out current city and limit to 4 nearby cities
        const nearbyCities = data.filter(city => city.name !== currentCity).slice(0, 4);
        
        // Fetch weather for each nearby city
        nearbyCities.forEach(city => {
            fetchWeatherData(city.name, city.lat, city.lon)
                .then(weatherData => {
                    if (weatherData) {
                        const card = document.createElement('div');
                        card.className = 'nearby-card';
                        card.addEventListener('click', () => {
                            fetchWeatherData(weatherData.current.name, weatherData.coords.lat, weatherData.coords.lon);
                        });
                        
                        const iconUrl = `https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}.png`;
                        
                        card.innerHTML = `
                            <div class="city-name">${weatherData.current.name}</div>
                            <img src="${iconUrl}" alt="${weatherData.current.weather[0].description}">
                            <div class="temp">${Math.round(weatherData.current.main.temp)}°C</div>
                        `;
                        
                        nearbyContainer.appendChild(card);
                    }
                })
                .catch(error => {
                    console.error('Error fetching weather for nearby city:', error);
                });
        });
    } catch (error) {
        console.error('Failed to fetch nearby cities:', error);
        document.getElementById('nearby-container').innerHTML = 
            '<p>Unable to load nearby cities</p>';
    }
}

export function showErrorPage() {
    document.querySelector('.container > div:not(.error-page)').style.display = 'none';
    document.getElementById('error-page').style.display = 'block';
}