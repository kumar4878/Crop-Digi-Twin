import { Router } from 'express';
import { CropCalendar } from '../models/CropCalendar';
import { FieldCropStage } from '../models/FieldCropStage';
import { Field } from '../models/Field';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /crops/calendar/:cropId - Crop Stage Calendar
router.get('/calendar/:cropId', authGuard, async (req, res, next) => {
  try {
    const crop = await CropCalendar.findById(req.params.cropId);
    if (!crop) throw new AppError(404, 'Crop calendar not found');
    res.json(crop);
  } catch (error) {
    next(error);
  }
});

// GET /crops/master - List all crop types
router.get('/master', authGuard, async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter: any = {};
    if (search) filter.cropName = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const crops = await CropCalendar.find(filter).select('cropName category avgDuration growingSeasons');
    res.json(crops);
  } catch (error) {
    next(error);
  }
});

// POST /crops/master - Create Crop Calendar (Admin/Agronomist)
router.post('/master', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const crop = await CropCalendar.create(req.body);
    res.status(201).json({ cropId: crop._id, message: 'Crop calendar created' });
  } catch (error) {
    next(error);
  }
});

// POST /crops/field/:fieldId/update-stage - Manual Stage Override
router.post('/field/:fieldId/update-stage', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { newStage, reason, overrideAuto } = req.body;
    const stageRecord = await FieldCropStage.findOne({ fieldId: req.params.fieldId }).sort({ createdAt: -1 });
    if (!stageRecord) throw new AppError(404, 'No crop stage record found for this field');

    const stages = ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST'];
    if (!stages.includes(newStage)) throw new AppError(400, 'Invalid stage');

    // Close current stage
    const lastEntry = stageRecord.stageHistory[stageRecord.stageHistory.length - 1];
    if (lastEntry) {
      lastEntry.exitedAt = new Date();
      lastEntry.durationDays = Math.ceil((new Date().getTime() - lastEntry.enteredAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Open new stage
    stageRecord.currentStage = newStage as any;
    stageRecord.stageHistory.push({
      stage: newStage as any,
      enteredAt: new Date(),
      durationDays: 0,
      wasAutoProgressed: !overrideAuto,
      overriddenBy: overrideAuto ? req.user!.id as any : undefined,
    });
    await stageRecord.save();

    // Update field's current crop stage info
    await Field.findByIdAndUpdate(req.params.fieldId, {
      'currentCrop.status': newStage === 'HARVEST' ? 'HARVESTED' : 'ACTIVE',
    });

    res.json({ message: `Stage updated to ${newStage}`, reason });
  } catch (error) {
    next(error);
  }
});

// GET /crops/field/:fieldId/advisory - Get Stage Advisory
router.get('/field/:fieldId/advisory', authGuard, async (req, res, next) => {
  try {
    const stageRecord = await FieldCropStage.findOne({ fieldId: req.params.fieldId }).sort({ createdAt: -1 });
    if (!stageRecord) throw new AppError(404, 'No crop stage record found');

    const crop = await CropCalendar.findById(stageRecord.cropId);
    if (!crop) throw new AppError(404, 'Crop calendar not found');

    const currentStageConfig = crop.stages.find((s) => s.stage === stageRecord.currentStage);

    res.json({
      fieldId: req.params.fieldId,
      crop: crop.cropName,
      currentStage: stageRecord.currentStage,
      stageConfig: currentStageConfig,
      stageHistory: stageRecord.stageHistory,
      daysInStage: stageRecord.stageHistory.length > 0
        ? Math.ceil((new Date().getTime() - stageRecord.stageHistory[stageRecord.stageHistory.length - 1].enteredAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    });
  } catch (error) {
    next(error);
  }
});

// GET /crops/active - All active crops for user
router.get('/active', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const fields = await Field.find({
      'currentCrop.status': 'ACTIVE',
    }).populate('farmId', 'name userId');

    // Filter by user ownership (unless admin)
    const filtered = ['ADMIN', 'SUPER_ADMIN', 'CXO', 'MANAGER'].includes(req.user!.role)
      ? fields
      : fields.filter((f: any) => f.farmId?.userId?.toString() === req.user!.id);

    const result = await Promise.all(
      filtered.map(async (field) => {
        const stage = await FieldCropStage.findOne({ fieldId: field._id }).sort({ createdAt: -1 });
        return {
          fieldId: field._id,
          fieldName: field.name,
          farmName: (field.farmId as any)?.name,
          crop: field.currentCrop,
          currentStage: stage?.currentStage,
          healthScore: Math.round((field.healthMetrics.ndvi + 1) * 50),
        };
      })
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
