import { Router } from 'express';
import axios from 'axios';
import { WeatherSnapshot, WeatherAlert } from '../models/Weather';
import { Field } from '../models/Field';
import { config } from '../config/env';
import { redis } from '../db/redis';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /weather/current/:fieldId - Current Weather for Field
router.get('/current/:fieldId', authGuard, async (req, res, next) => {
  try {
    const field = await Field.findById(req.params.fieldId);
    if (!field) throw new AppError(404, 'Field not found');

    const [lat, lon] = [field.centroid.coordinates[1], field.centroid.coordinates[0]];
    const weather = await fetchCurrentWeather(lat, lon);

    // Save snapshot
    await WeatherSnapshot.create({
      fieldId: field._id,
      location: field.centroid,
      data: weather,
      source: 'OPENWEATHER',
      timestamp: new Date(),
    });

    // Check for anomalies
    const alerts = await checkWeatherAnomalies(field._id.toString(), weather);

    res.json({ weather, alerts });
  } catch (error) {
    next(error);
  }
});

// GET /weather/forecast/:fieldId - 7-Day Forecast
router.get('/forecast/:fieldId', authGuard, async (req, res, next) => {
  try {
    const field = await Field.findById(req.params.fieldId);
    if (!field) throw new AppError(404, 'Field not found');

    const [lat, lon] = [field.centroid.coordinates[1], field.centroid.coordinates[0]];
    const days = Number(req.query.days) || 7;
    const forecast = await fetchForecast(lat, lon, days);

    res.json({ fieldId: req.params.fieldId, forecast });
  } catch (error) {
    next(error);
  }
});

// GET /weather/alerts/:fieldId - Weather Alerts for Field
router.get('/alerts/:fieldId', authGuard, async (req, res, next) => {
  try {
    const alerts = await WeatherAlert.find({
      fieldId: req.params.fieldId,
      acknowledgedAt: { $exists: false },
    }).sort({ createdAt: -1 }).limit(20);

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

// POST /weather/alerts/:id/acknowledge - Acknowledge Alert
router.post('/alerts/:id/acknowledge', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const alert = await WeatherAlert.findByIdAndUpdate(
      req.params.id,
      { $set: { acknowledgedAt: new Date(), acknowledgedBy: req.user!.id } },
      { new: true }
    );
    if (!alert) throw new AppError(404, 'Alert not found');
    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// GET /weather/by-location - Weather by lat/lng (no field required)
router.get('/by-location', authGuard, async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) throw new AppError(400, 'lat and lon are required');
    const weather = await fetchCurrentWeather(Number(lat), Number(lon));
    res.json(weather);
  } catch (error) {
    next(error);
  }
});

// --- Helper Functions ---

async function fetchCurrentWeather(lat: number, lon: number) {
  // Check Redis cache first
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  if (!config.weatherApiKey) {
    // Return mock data if no API key
    const mock = {
      temperature: 28 + Math.random() * 5,
      feelsLike: 30 + Math.random() * 3,
      humidity: 60 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 10,
      rainfall: Math.random() > 0.7 ? Math.random() * 20 : 0,
      condition: ['Clear', 'Clouds', 'Rain', 'Drizzle'][Math.floor(Math.random() * 4)],
    };
    return mock;
  }

  try {
    const response = await axios.get(`${config.weatherBaseUrl}/onecall`, {
      params: { lat, lon, appid: config.weatherApiKey, units: 'metric', exclude: 'minutely,hourly' },
    });

    const weather = {
      temperature: response.data.current.temp,
      feelsLike: response.data.current.feels_like,
      humidity: response.data.current.humidity,
      windSpeed: response.data.current.wind_speed,
      rainfall: response.data.current.rain?.['1h'] || 0,
      condition: response.data.current.weather[0].main,
    };

    // Cache for 5 minutes
    try { await redis.setex(cacheKey, 300, JSON.stringify(weather)); } catch {}

    return weather;
  } catch (error) {
    console.error('[weather]: API fetch error:', error);
    throw new AppError(503, 'Weather service temporarily unavailable');
  }
}

async function fetchForecast(lat: number, lon: number, days: number) {
  if (!config.weatherApiKey) {
    // Return mock forecast
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      tempMin: 22 + Math.random() * 5,
      tempMax: 32 + Math.random() * 5,
      humidity: 50 + Math.random() * 30,
      rainfall: Math.random() > 0.6 ? Math.random() * 25 : 0,
      windSpeed: 3 + Math.random() * 12,
      condition: ['Clear', 'Clouds', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 4)],
    }));
  }

  const response = await axios.get(`${config.weatherBaseUrl}/onecall`, {
    params: { lat, lon, appid: config.weatherApiKey, units: 'metric', exclude: 'current,minutely,hourly' },
  });

  return response.data.daily.slice(0, days).map((day: any) => ({
    date: new Date(day.dt * 1000).toISOString().split('T')[0],
    tempMin: day.temp.min,
    tempMax: day.temp.max,
    humidity: day.humidity,
    rainfall: day.rain || 0,
    windSpeed: day.wind_speed,
    condition: day.weather[0].main,
  }));
}

async function checkWeatherAnomalies(fieldId: string, weather: any) {
  const alerts: any[] = [];

  if (weather.temperature > 40) {
    alerts.push({ type: 'HEAT_WAVE', severity: 'HIGH', message: 'Extreme heat detected. Consider additional irrigation.' });
  }
  if (weather.temperature < 10) {
    alerts.push({ type: 'COLD_WAVE', severity: 'MEDIUM', message: 'Low temperature alert. Protect sensitive crops.' });
  }
  if (weather.rainfall > 50) {
    alerts.push({ type: 'HEAVY_RAIN', severity: 'HIGH', message: 'Heavy rainfall detected. Check drainage systems.' });
  }
  if (weather.windSpeed > 50) {
    alerts.push({ type: 'STORM', severity: 'CRITICAL', message: 'Storm conditions. Secure equipment and protection structures.' });
  }

  for (const alert of alerts) {
    await WeatherAlert.create({
      fieldId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      weatherData: weather,
      actionable: true,
      recommendations: [alert.message],
    });
  }

  return alerts;
}

export default router;
