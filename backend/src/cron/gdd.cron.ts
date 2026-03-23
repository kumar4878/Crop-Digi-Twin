import cron from 'node-cron';
import { gddService } from '../services/gdd.service';

/**
 * Initializes the automated daily job for testing field GDD growth vs thresholds.
 * In a real-world enterprise setting, this could be offloaded to Agenda, BullMQ, or AWS EventBridge.
 */
export function startGDDEngineCron() {
  // Run daily at 6:00 AM server time
  // This computes exactly 1 day of weather/GDD history per night
  cron.schedule('0 6 * * *', async () => {
    console.log('[Cron] Triggering Daily GDD Engine Auto-Progression Batch');
    try {
      await gddService.autoProgressStages();
    } catch (error) {
      console.error('[Cron] GDD Engine Execution failed:', error);
    }
  });

  console.log('[System] Scheduled GDD Engine cron job for 06:00 AM daily.');
}
