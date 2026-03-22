import api from '@/lib/api'
import axios from 'axios'

// --- Open-Meteo types ---
export interface OpenMeteoCurrentWeather {
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windDirection: number
    windGusts: number
    rainfall: number
    condition: string
    conditionIcon: string
    uvIndex: number
    cloudCover: number
    pressure: number
    dewPoint: number
    visibility: number
}

export interface HourlyData {
    time: string
    temperature: number
    feelsLike: number
    humidity: number
    dewPoint: number
    precipitation: number
    precipitationProbability: number
    weatherCode: number
    condition: string
    conditionIcon: string
    windSpeed: number
    windDirection: number
    windGusts: number
    cloudCover: number
    visibility: number
    uvIndex: number
    pressure: number
    soilTemperature: number
    soilMoisture: number
    evapotranspiration: number
}

export interface DailyData {
    date: string
    tempMin: number
    tempMax: number
    feelsLikeMin: number
    feelsLikeMax: number
    rainfall: number
    precipitationHours: number
    precipitationProbabilityMax: number
    windSpeedMax: number
    windGustsMax: number
    windDirectionDominant: number
    condition: string
    conditionIcon: string
    weatherCode: number
    uvIndexMax: number
    sunrise: string
    sunset: string
    daylightDuration: number
    et0Evapotranspiration: number
}

export interface LocationInfo {
    city: string
    state: string
    country: string
    displayName: string
}

export interface OpenMeteoFullWeather {
    current: OpenMeteoCurrentWeather
    hourly: HourlyData[]
    daily: DailyData[]
}

// --- WMO Weather Code mapping ---
function wmoCodeToCondition(code: number): { condition: string; icon: string } {
    if (code === 0) return { condition: 'Clear Sky', icon: '☀️' }
    if (code === 1) return { condition: 'Mainly Clear', icon: '🌤️' }
    if (code === 2) return { condition: 'Partly Cloudy', icon: '⛅' }
    if (code === 3) return { condition: 'Overcast', icon: '☁️' }
    if (code <= 49) return { condition: 'Foggy', icon: '🌫️' }
    if (code <= 55) return { condition: 'Drizzle', icon: '🌦️' }
    if (code <= 57) return { condition: 'Freezing Drizzle', icon: '🌧️' }
    if (code <= 65) return { condition: 'Rain', icon: '🌧️' }
    if (code <= 67) return { condition: 'Freezing Rain', icon: '🌧️' }
    if (code <= 77) return { condition: 'Snow', icon: '🌨️' }
    if (code <= 82) return { condition: 'Rain Showers', icon: '🌧️' }
    if (code <= 86) return { condition: 'Snow Showers', icon: '🌨️' }
    if (code === 95) return { condition: 'Thunderstorm', icon: '⛈️' }
    if (code <= 99) return { condition: 'Thunderstorm with Hail', icon: '⛈️' }
    return { condition: 'Unknown', icon: '🌤️' }
}

/** Wind direction in degrees to compass */
export function degreesToCompass(deg: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return dirs[Math.round(deg / 22.5) % 16]
}

/**
 * Fetch comprehensive weather data from Open-Meteo:
 * Current + hourly (all 16 days) + daily (16 days).
 */
export async function getOpenMeteoWeather(lat: number, lon: number): Promise<OpenMeteoFullWeather> {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
            latitude: lat,
            longitude: lon,
            // Current
            current: [
                'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
                'precipitation', 'weather_code', 'wind_speed_10m', 'wind_direction_10m',
                'wind_gusts_10m', 'uv_index', 'cloud_cover', 'surface_pressure',
                'dew_point_2m',
            ].join(','),
            // Hourly (all 16 days)
            hourly: [
                'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
                'dew_point_2m', 'precipitation', 'precipitation_probability',
                'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
                'cloud_cover', 'visibility', 'uv_index', 'surface_pressure',
                'soil_temperature_0cm', 'soil_moisture_0_to_1cm', 'evapotranspiration',
            ].join(','),
            // Daily
            daily: [
                'temperature_2m_max', 'temperature_2m_min',
                'apparent_temperature_max', 'apparent_temperature_min',
                'precipitation_sum', 'precipitation_hours', 'precipitation_probability_max',
                'weather_code', 'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
                'uv_index_max', 'sunrise', 'sunset', 'daylight_duration',
                'et0_fao_evapotranspiration',
            ].join(','),
            forecast_days: 16,
            timezone: 'auto',
        },
    })

    // Parse current
    const curWmo = wmoCodeToCondition(data.current.weather_code)
    const current: OpenMeteoCurrentWeather = {
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m ?? 0,
        windGusts: data.current.wind_gusts_10m ?? 0,
        rainfall: data.current.precipitation,
        condition: curWmo.condition,
        conditionIcon: curWmo.icon,
        uvIndex: data.current.uv_index ?? 0,
        cloudCover: data.current.cloud_cover ?? 0,
        pressure: data.current.surface_pressure ?? 0,
        dewPoint: data.current.dew_point_2m ?? 0,
        visibility: 0,
    }

    // Parse hourly
    const hourly: HourlyData[] = data.hourly.time.map((t: string, i: number) => {
        const wmo = wmoCodeToCondition(data.hourly.weather_code[i])
        return {
            time: t,
            temperature: data.hourly.temperature_2m[i],
            feelsLike: data.hourly.apparent_temperature[i],
            humidity: data.hourly.relative_humidity_2m[i],
            dewPoint: data.hourly.dew_point_2m[i],
            precipitation: data.hourly.precipitation[i],
            precipitationProbability: data.hourly.precipitation_probability[i],
            weatherCode: data.hourly.weather_code[i],
            condition: wmo.condition,
            conditionIcon: wmo.icon,
            windSpeed: data.hourly.wind_speed_10m[i],
            windDirection: data.hourly.wind_direction_10m[i],
            windGusts: data.hourly.wind_gusts_10m[i],
            cloudCover: data.hourly.cloud_cover[i],
            visibility: data.hourly.visibility?.[i] ?? 0,
            uvIndex: data.hourly.uv_index?.[i] ?? 0,
            pressure: data.hourly.surface_pressure?.[i] ?? 0,
            soilTemperature: data.hourly.soil_temperature_0cm?.[i] ?? 0,
            soilMoisture: data.hourly.soil_moisture_0_to_1cm?.[i] ?? 0,
            evapotranspiration: data.hourly.evapotranspiration?.[i] ?? 0,
        }
    })

    // Parse daily
    const daily: DailyData[] = data.daily.time.map((d: string, i: number) => {
        const wmo = wmoCodeToCondition(data.daily.weather_code[i])
        return {
            date: d,
            tempMin: data.daily.temperature_2m_min[i],
            tempMax: data.daily.temperature_2m_max[i],
            feelsLikeMin: data.daily.apparent_temperature_min?.[i] ?? 0,
            feelsLikeMax: data.daily.apparent_temperature_max?.[i] ?? 0,
            rainfall: data.daily.precipitation_sum[i],
            precipitationHours: data.daily.precipitation_hours?.[i] ?? 0,
            precipitationProbabilityMax: data.daily.precipitation_probability_max?.[i] ?? 0,
            windSpeedMax: data.daily.wind_speed_10m_max?.[i] ?? 0,
            windGustsMax: data.daily.wind_gusts_10m_max?.[i] ?? 0,
            windDirectionDominant: data.daily.wind_direction_10m_dominant?.[i] ?? 0,
            condition: wmo.condition,
            conditionIcon: wmo.icon,
            weatherCode: data.daily.weather_code[i],
            uvIndexMax: data.daily.uv_index_max?.[i] ?? 0,
            sunrise: data.daily.sunrise?.[i] ?? '',
            sunset: data.daily.sunset?.[i] ?? '',
            daylightDuration: data.daily.daylight_duration?.[i] ?? 0,
            et0Evapotranspiration: data.daily.et0_fao_evapotranspiration?.[i] ?? 0,
        }
    })

    return { current, hourly, daily }
}

/**
 * Reverse geocode lat/lon to a human-readable location name.
 * Uses OpenStreetMap Nominatim (free, no key needed).
 */
export async function reverseGeocode(lat: number, lon: number): Promise<LocationInfo> {
    try {
        const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'json', zoom: 10 },
            headers: { 'User-Agent': 'CropFarm/1.0' },
        })
        const addr = data.address || {}
        return {
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            country: addr.country || '',
            displayName: [
                addr.city || addr.town || addr.village || addr.county || '',
                addr.state || '',
            ].filter(Boolean).join(', '),
        }
    } catch {
        return { city: '', state: '', country: '', displayName: 'Your Location' }
    }
}

// --- Backend API functions (kept for field-specific weather) ---

export interface WeatherByLocationResponse {
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    rainfall: number
    condition: string
}

export async function getWeatherByLocation(lat: number, lon: number): Promise<WeatherByLocationResponse> {
    const { data } = await api.get('/weather/by-location', { params: { lat, lon } })
    return data
}

export async function getCurrentWeather(fieldId: string) {
    const { data } = await api.get(`/weather/current/${fieldId}`)
    return data
}

export async function getForecast(fieldId: string, days = 7) {
    const { data } = await api.get(`/weather/forecast/${fieldId}`, { params: { days } })
    return data
}

export async function getWeatherAlerts(fieldId: string) {
    const { data } = await api.get(`/weather/alerts/${fieldId}`)
    return data
}
