import cron from 'node-cron';
import { Field } from '../models/Field';
import { CropCalendar } from '../models/CropCalendar';
import { FieldCropStage } from '../models/FieldCropStage';
import axios from 'axios';

const CROP_STAGES_ORDER = ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST'];

/**
 * Calculate Growing Degree Days (GDD) from a base temperature.
 * GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 */
function calcGDD(tMax: number, tMin: number, tBase: number): number {
  return Math.max(0, (tMax + tMin) / 2 - tBase);
}

/**
 * DDE Cron Job — runs daily at 6:00 AM
 * 1. Fetches all fields with active crops
 * 2. Gets weather data to calculate GDD
 * 3. Auto-advances crop stage when duration threshold is met
 */
export function startDDECron() {
  console.log('[DDE] Cron scheduler initialized — runs daily at 06:00');

  // Run daily at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('[DDE] Running daily crop stage progression check...');

    try {
      // 1. Get all fields with active crops
      const fields = await Field.find({
        'currentCrop.status': 'ACTIVE',
        status: 'ACTIVE',
      });

      if (fields.length === 0) {
        console.log('[DDE] No active crops found — skipping');
        return;
      }

      console.log(`[DDE] Found ${fields.length} fields with active crops`);

      // 2. Get weather data (use a central location — will be per-field in production)
      let dailyTemps = { tMax: 30, tMin: 20 };
      try {
        const weatherRes = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=17.385&longitude=78.487&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Kolkata&forecast_days=1'
        );
        if (weatherRes.data?.daily) {
          dailyTemps.tMax = weatherRes.data.daily.temperature_2m_max[0] || 30;
          dailyTemps.tMin = weatherRes.data.daily.temperature_2m_min[0] || 20;
        }
      } catch {
        console.log('[DDE] Weather fetch failed — using defaults');
      }

      // 3. Process each field
      for (const field of fields) {
        const crop = field.currentCrop;
        if (!crop?.cropId || !crop?.sowingDate) continue;

        // Lookup crop calendar for stage durations
        const calendar = await CropCalendar.findById(crop.cropId);
        if (!calendar?.stages) continue;

        // Calculate days since sowing
        const daysSinceSowing = Math.floor(
          (Date.now() - new Date(crop.sowingDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate GDD
        const tBase = calendar.tBase || 10;
        const gdd = calcGDD(dailyTemps.tMax, dailyTemps.tMin, tBase);

        // Determine expected stage based on cumulative duration
        let cumulativeDays = 0;
        let expectedStage = 'SOWING';
        for (const stageInfo of calendar.stages) {
          cumulativeDays += stageInfo.durationDays;
          if (daysSinceSowing < cumulativeDays) {
            expectedStage = stageInfo.stage;
            break;
          }
          expectedStage = stageInfo.stage;
        }

        // If expected stage is ahead of current stage, advance
        const currentIdx = CROP_STAGES_ORDER.indexOf(crop.status || 'SOWING');
        const expectedIdx = CROP_STAGES_ORDER.indexOf(expectedStage);

        if (expectedIdx > currentIdx && expectedIdx < CROP_STAGES_ORDER.length) {
          console.log(`[DDE] Field ${field.name}: ${crop.status} → ${expectedStage} (day ${daysSinceSowing}, GDD today: ${gdd.toFixed(1)})`);

          // Update field's current crop status
          await Field.findByIdAndUpdate(field._id, {
            $set: { 'currentCrop.status': expectedStage }
          });

          // Update stage tracking
          await FieldCropStage.findOneAndUpdate(
            { fieldId: field._id, cropId: crop.cropId },
            {
              $set: { currentStage: expectedStage },
              $push: {
                stageHistory: {
                  stage: expectedStage,
                  enteredAt: new Date(),
                  durationDays: daysSinceSowing,
                  wasAutoProgressed: true,
                  gddAccumulated: gdd,
                }
              }
            }
          );
        }
      }

      console.log('[DDE] Daily progression check complete');
    } catch (error) {
      console.error('[DDE] Cron error:', error);
    }
  });
}
