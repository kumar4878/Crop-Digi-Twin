import express from 'express';
import { EventModel } from '../models/Event';
import { DigitalTwinModel } from '../models/DigitalTwin';
import { authGuard, AuthRequest } from '../middleware/authGuard';

const router = express.Router();

/**
 * @route   GET /api/events/plot/:plotId/season/:season
 * @desc    Get the immutable event ledger (timeline) for a specific plot and season 
 * @access  Private
 */
router.get('/plot/:plotId/season/:season', authGuard, async (req: any, res: any) => {
  try {
    const { plotId, season } = req.params;

    const events = await EventModel.find({ plotId, season })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: events.length, events });
  } catch (error: any) {
    console.error(`[EventRoutes] Error fetching events: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch event timeline' });
  }
});

/**
 * @route   GET /api/events/digital-twin/:plotId/:season
 * @desc    Get the materialized Digital Twin state for a specific plot and season
 * @access  Private
 */
router.get('/digital-twin/:plotId/:season', authGuard, async (req: any, res: any) => {
  try {
    const { plotId, season } = req.params;

    const twin = await DigitalTwinModel.findOne({ plotId, season }).lean();
    
    if (!twin) {
      return res.status(404).json({ success: false, error: 'Digital Twin not found' });
    }

    res.json({ success: true, twin });
  } catch (error: any) {
    console.error(`[EventRoutes] Error fetching digital twin: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch digital twin' });
  }
});

export default router;
