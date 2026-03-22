import { Router } from 'express';
import axios from 'axios';
import { CropCalendar } from '../models/CropCalendar';
import { SAPSyncLog } from '../models/AuditLog';
import { config } from '../config/env';
import { authGuard } from '../middleware/authGuard';
import { authorize } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /integration/sap/pull/master-data
router.post('/pull/master-data', authGuard, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { entity, lastSyncDate } = req.body;
    if (!entity) throw new AppError(400, 'Entity type is required');

    if (!config.sapOdataUrl) {
      // Mock SAP data for development
      const mockCrops = [
        { cropName: 'Rice', category: 'Cereal', avgDuration: 120, tBase: 10, growingSeasons: ['Kharif'], totalDuration: 120,
          stages: [
            { stage: 'SOWING', durationDays: 7, gddRequired: 50, keyActivities: ['Land preparation', 'Seed treatment'], criticalWeatherParams: { minTemp: 20, maxTemp: 35 }, advisories: [] },
            { stage: 'GERMINATION', durationDays: 14, gddRequired: 150, keyActivities: ['Ensure adequate moisture'], criticalWeatherParams: { minTemp: 18, maxTemp: 38 }, advisories: [] },
            { stage: 'VEGETATIVE', durationDays: 35, gddRequired: 450, keyActivities: ['Nitrogen application', 'Weed control'], criticalWeatherParams: { minTemp: 20, maxTemp: 35, minRainfall: 5 }, advisories: [] },
            { stage: 'FLOWERING', durationDays: 20, gddRequired: 700, keyActivities: ['Pest monitoring', 'Potassium application'], criticalWeatherParams: { minTemp: 22, maxTemp: 35 }, advisories: [] },
            { stage: 'FRUITING', durationDays: 20, gddRequired: 900, keyActivities: ['Water management'], criticalWeatherParams: { minTemp: 20, maxTemp: 33 }, advisories: [] },
            { stage: 'MATURATION', durationDays: 15, gddRequired: 1100, keyActivities: ['Drain field'], criticalWeatherParams: { maxRainfall: 10 }, advisories: [] },
            { stage: 'HARVEST', durationDays: 7, keyActivities: ['Harvest at right moisture'], criticalWeatherParams: {}, advisories: [] },
          ],
        },
        { cropName: 'Tomato', category: 'Vegetable', avgDuration: 100, tBase: 10, growingSeasons: ['Kharif', 'Rabi'], totalDuration: 100,
          stages: [
            { stage: 'SOWING', durationDays: 10, gddRequired: 60, keyActivities: ['Nursery preparation'], criticalWeatherParams: { minTemp: 18, maxTemp: 30 }, advisories: [] },
            { stage: 'GERMINATION', durationDays: 10, gddRequired: 120, keyActivities: ['Transplant seedlings'], criticalWeatherParams: { minTemp: 18, maxTemp: 32 }, advisories: [] },
            { stage: 'VEGETATIVE', durationDays: 25, gddRequired: 350, keyActivities: ['Staking', 'NPK application'], criticalWeatherParams: { minTemp: 18, maxTemp: 30 }, advisories: [] },
            { stage: 'FLOWERING', durationDays: 20, gddRequired: 550, keyActivities: ['Monitor Leaf Curling'], criticalWeatherParams: { minTemp: 20, maxTemp: 30 }, advisories: [] },
            { stage: 'FRUITING', durationDays: 25, gddRequired: 800, keyActivities: ['Calcium spray', 'Pest control'], criticalWeatherParams: { minTemp: 18, maxTemp: 32 }, advisories: [] },
            { stage: 'HARVEST', durationDays: 10, keyActivities: ['Pick at breaker stage'], criticalWeatherParams: {}, advisories: [] },
          ],
        },
      ];

      for (const crop of mockCrops) {
        await CropCalendar.findOneAndUpdate({ cropName: crop.cropName }, { $set: crop }, { upsert: true });
      }
      await SAPSyncLog.create({ entity, direction: 'INBOUND', recordCount: mockCrops.length, status: 'SUCCESS' });
      return res.json({ message: `Synced ${mockCrops.length} ${entity} records (mock)`, count: mockCrops.length });
    }

    // Real SAP integration
    const response = await axios.get(`${config.sapOdataUrl}/CropMasterSet`, {
      auth: { username: config.sapUsername, password: config.sapPassword },
    });
    const records = response.data.d.results;
    await SAPSyncLog.create({ entity, direction: 'INBOUND', recordCount: records.length, status: 'SUCCESS' });
    res.json({ message: `Synced ${records.length} records`, count: records.length });
  } catch (error) {
    next(error);
  }
});

// GET /integration/sap/sync-status
router.get('/sync-status', authGuard, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const logs = await SAPSyncLog.find().sort({ timestamp: -1 }).limit(20);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
