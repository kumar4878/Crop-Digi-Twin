import express, { Request, Response } from 'express';
import { gddService } from '../services/gdd.service';
import { authGuard, AuthRequest } from '../middleware/authGuard';

const router = express.Router();

/**
 * @route   GET /api/gdd/field/:fieldId/check
 * @desc    Check current GDD accumulation and readiness to jump to next stage
 * @access  Private
 */
router.get('/field/:fieldId/check', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const check = await gddService.checkStageProgression(fieldId);
    
    res.json({ success: true, data: check });
  } catch (error: any) {
    console.error(`[GDDRoutes] Error checking GDD progress:`, error);
    res.status(500).json({ success: false, error: error.message || 'Internal GDD calculation error' });
  }
});

/**
 * @route   POST /api/gdd/auto-progress-all
 * @desc    Admin trigger to manually run the GDD background Engine
 * @access  Private (Admin)
 */
router.post('/auto-progress-all', authGuard, async (req: AuthRequest, res: Response) => {
  try {
     if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
     }
     
     const result = await gddService.autoProgressStages();
     res.json(result);
  } catch (error: any) {
    console.error(`[GDDRoutes] Error running GDD batch:`, error);
    res.status(500).json({ success: false, error: 'Internal GDD Batch error' });
  }
});

export default router;
