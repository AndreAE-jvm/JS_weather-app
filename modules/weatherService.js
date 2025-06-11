export const API_KEY = 'Ваш API';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct';
export const REVERSE_GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/reverse';



export async function fetchWeatherData(city, lat, lon) {
    try {
        // Если переданы координаты, сразу запрашиваем погоду
        if (lat && lon) {
            const [current, forecast] = await Promise.all([
                fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
                    .then(res => res.json()),
                fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
                    .then(res => res.json())
            ]);
            
            return { current, forecast, coords: { lat, lon } };
        }

        // Если передан город, сначала получаем координаты
        const geoResponse = await fetch(`${GEOCODING_URL}?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoResponse.json();
        
        if (!geoData?.length) {
            throw new Error('City not found');
        }

        const { lat: cityLat, lon: cityLon, name } = geoData[0];
        const [current, forecast] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${cityLat}&lon=${cityLon}&units=metric&appid=${API_KEY}`)
                .then(res => res.json()),
            fetch(`${BASE_URL}/forecast?lat=${cityLat}&lon=${cityLon}&units=metric&appid=${API_KEY}`)
                .then(res => res.json())
        ]);

        return { current, forecast, coords: { lat: cityLat, lon: cityLon } };
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function fetchGeocodingData(city) {
    try {
        const response = await fetch(`${GEOCODING_URL}?q=${city}&limit=1&appid=${API_KEY}`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            showErrorPage();
            return null;
        }
        
        return {
            lat: data[0].lat,
            lon: data[0].lon,
            name: data[0].name
        };
    } catch (error) {
        console.error('Error fetching geocoding data:', error);
        showErrorPage();
        return null;
    }
}

export function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((degrees % 360) / 45);
    return directions[index % 8];
}