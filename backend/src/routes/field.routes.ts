import { Router } from 'express';
import { Field } from '../models/Field';
import { FieldCropStage } from '../models/FieldCropStage';
import { CropCalendar } from '../models/CropCalendar';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /fields - Create Field
router.post('/', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { farmId, name, boundary, soilType, irrigationType, elevation, slope } = req.body;

    if (!farmId || !name || !boundary || !soilType || !irrigationType) {
      throw new AppError(400, 'Required fields: farmId, name, boundary, soilType, irrigationType');
    }

    // Calculate centroid from polygon
    const coords = boundary.coordinates[0];
    const lngSum = coords.reduce((s: number, c: number[]) => s + c[0], 0);
    const latSum = coords.reduce((s: number, c: number[]) => s + c[1], 0);
    const centroid = {
      type: 'Point' as const,
      coordinates: [lngSum / coords.length, latSum / coords.length] as [number, number],
    };

    // Calculate area (simple approximation using Shoelace formula for lat/lng)
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    area = Math.abs(area / 2) * 111319.5 * 111319.5 * Math.cos((latSum / coords.length) * Math.PI / 180);
    const areaInAcres = area * 0.000247105; // m² to acres

    const field = await Field.create({
      farmId,
      name,
      boundary,
      centroid,
      area: Math.round(areaInAcres * 100) / 100,
      soilType,
      irrigationType,
      elevation,
      slope,
    });

    res.status(201).json({ fieldId: field._id, area: field.area, message: 'Field created successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /fields/farm/:farmId - Fields by Farm
router.get('/farm/:farmId', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const fields = await Field.find({ farmId: req.params.farmId, status: { $ne: 'INACTIVE' } })
      .select('name area soilType irrigationType currentCrop healthMetrics status');
    res.json(fields);
  } catch (error) {
    next(error);
  }
});

// GET /fields/:id - Field Details
router.get('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) {
      throw new AppError(404, 'Field not found');
    }

    const stageHistory = await FieldCropStage.findOne({
      fieldId: field._id,
      ...(field.currentCrop?.season ? { season: field.currentCrop.season } : {}),
    });

    res.json({ ...field.toJSON(), stageHistory });
  } catch (error) {
    next(error);
  }
});

// POST /fields/:id/assign-crop - Assign Crop
router.post('/:id/assign-crop', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { cropId, season, sowingDate, expectedHarvestDate, targetYield, seedVariety } = req.body;
    const field = await Field.findById(req.params.id);
    if (!field) throw new AppError(404, 'Field not found');

    if (field.currentCrop?.status === 'ACTIVE') {
      throw new AppError(409, `Field already has an active crop (${field.currentCrop.cropName}) for this season`);
    }

    const crop = await CropCalendar.findById(cropId);
    if (!crop) throw new AppError(404, 'Crop not found');

    // Update field with crop assignment
    field.currentCrop = {
      cropId: crop._id,
      cropName: crop.cropName,
      season,
      sowingDate: new Date(sowingDate),
      expectedHarvestDate: new Date(expectedHarvestDate),
      targetYield,
      seedVariety,
      status: 'ACTIVE',
      assignedAt: new Date(),
    };
    await field.save();

    // Create field crop stage tracking
    await FieldCropStage.create({
      fieldId: field._id,
      cropId: crop._id,
      season,
      sowingDate: new Date(sowingDate),
      currentStage: 'SOWING',
      stageHistory: [{ stage: 'SOWING', enteredAt: new Date(), durationDays: 0, wasAutoProgressed: false }],
      expectedHarvestDate: new Date(expectedHarvestDate),
    });

    res.status(201).json({ message: 'Crop assigned successfully', fieldId: field._id });
  } catch (error) {
    next(error);
  }
});

// PATCH /fields/:id - Update Field
router.patch('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const field = await Field.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!field) throw new AppError(404, 'Field not found');
    res.json(field);
  } catch (error) {
    next(error);
  }
});

// DELETE /fields/:id - Soft Delete
router.delete('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const field = await Field.findByIdAndUpdate(req.params.id, { $set: { status: 'INACTIVE' } }, { new: true });
    if (!field) throw new AppError(404, 'Field not found');
    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
