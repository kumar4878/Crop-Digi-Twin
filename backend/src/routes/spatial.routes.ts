import express, { Request, Response } from 'express';
import { Field } from '../models/Field';
import { spatialMatchingService } from '../services/spatialMatching.service';
import { authGuard, AuthRequest } from '../middleware/authGuard';

const router = express.Router();

/**
 * @route   POST /api/spatial/match-field/:fieldId
 * @desc    Trigger explicit intersection test against official Village map polygons
 * @access  Private
 */
router.post('/match-field/:fieldId', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;

    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    if (!field.boundary || !field.boundary.coordinates) {
      return res.status(400).json({ success: false, error: 'Field boundary missing' });
    }

    const match = await spatialMatchingService.matchFieldToVillage(fieldId, field.boundary);
    res.json({ success: true, match });
  } catch (error: any) {
    console.error(`[SpatialRoutes] Match Error:`, error);
    res.status(500).json({ success: false, error: 'Internal spatial processing error' });
  }
});

/**
 * @route   POST /api/spatial/match-all-fields
 * @desc    Batch job entry point for processing unmatched fields globally
 * @access  Private (Admin)
 */
router.post('/match-all-fields', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    // Basic Role validation
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const result = await spatialMatchingService.matchAllUnassignedFields();
    res.json({ success: true, result });
  } catch (error: any) {
    console.error(`[SpatialRoutes] Batch Match Error:`, error);
    res.status(500).json({ success: false, error: 'Internal spatial batch processing error' });
  }
});

export default router;
