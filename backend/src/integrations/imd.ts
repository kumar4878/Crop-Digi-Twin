// IMD / GKMS Weather Integration Stub
// In production, this connects to India Meteorological Department APIs
import axios from 'axios';
import { config } from '../config/env';

export class IMDService {
  async getForecast(lat: number, lon: number, days: number = 5) {
    if (!config.imdApiUrl) {
      console.log('[imd]: No IMD API configured, using mock data');
      return this.getMockForecast(days);
    }
    try {
      const response = await axios.get(`${config.imdApiUrl}/forecast`, { params: { lat, lon, days } });
      return response.data;
    } catch (error) {
      console.error('[imd]: IMD API error, falling back to mock');
      return this.getMockForecast(days);
    }
  }

  async getAgrometAdvisory(district: string, state: string) {
    if (!config.imdApiUrl) return { advisory: 'No IMD advisory available', source: 'MOCK' };
    try {
      const response = await axios.get(`${config.imdApiUrl}/agromet`, { params: { district, state } });
      return response.data;
    } catch { return { advisory: 'IMD unavailable', source: 'FALLBACK' }; }
  }

  private getMockForecast(days: number) {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      rainfall: Math.random() > 0.6 ? Math.round(Math.random() * 30) : 0,
      tempMax: 30 + Math.round(Math.random() * 8),
      tempMin: 20 + Math.round(Math.random() * 5),
      humidity: 60 + Math.round(Math.random() * 25),
      source: 'MOCK',
    }));
  }
}

export const imdService = new IMDService();
