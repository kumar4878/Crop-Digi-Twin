import { Router } from 'express';
import { Farm } from '../models/Farm';
import { Field } from '../models/Field';
import { PestIncident } from '../models/PestIncident';
import { WeatherAlert } from '../models/Weather';
import { Notification } from '../models/Notification';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { authorize } from '../middleware/rbac';

const router = Router();

// GET /dashboard/farmer
router.get('/farmer', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const [farmCount, notifications] = await Promise.all([
      Farm.countDocuments({ userId, deletedAt: { $exists: false } }),
      Notification.find({ userId, readAt: { $exists: false } }).sort({ createdAt: -1 }).limit(5),
    ]);

    const userFarms = await Farm.find({ userId, deletedAt: { $exists: false } }).select('_id');
    const farmIds = userFarms.map(f => f._id);
    const fields = await Field.find({ farmId: { $in: farmIds }, status: 'ACTIVE' });

    const activeCrops = fields.filter(f => f.currentCrop?.status === 'ACTIVE');
    const avgHealth = fields.length > 0
      ? Math.round(fields.reduce((s, f) => s + (f.healthMetrics.ndvi + 1) * 50, 0) / fields.length) : 0;

    res.json({
      overview: { totalFarms: farmCount, totalFields: fields.length, activeCrops: activeCrops.length, cropHealthIndex: avgHealth },
      activeCropsList: activeCrops.slice(0, 10).map(f => ({
        fieldId: f._id, fieldName: f.name, crop: f.currentCrop?.cropName, stage: f.currentCrop?.status,
      })),
      unreadNotifications: notifications,
    });
  } catch (error) { next(error); }
});

// GET /dashboard/cxo
router.get('/cxo', authGuard, authorize('CXO', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const [totalFarms, totalFields, pestOutbreaks, weatherAnomalies] = await Promise.all([
      Farm.countDocuments({ deletedAt: { $exists: false } }),
      Field.countDocuments({ status: 'ACTIVE' }),
      PestIncident.countDocuments({ status: { $in: ['REPORTED', 'UNDER_TREATMENT'] }, severity: { $in: ['HIGH', 'CRITICAL'] } }),
      WeatherAlert.countDocuments({ acknowledgedAt: { $exists: false }, severity: { $in: ['HIGH', 'CRITICAL'] } }),
    ]);

    const acreageResult = await Field.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$area' }, avgNdvi: { $avg: '$healthMetrics.ndvi' } } },
    ]);

    res.json({
      overview: {
        totalFarms, totalAcreage: Math.round(acreageResult[0]?.total || 0),
        activeFarmers: totalFarms, cropHealthIndex: acreageResult[0] ? Math.round((acreageResult[0].avgNdvi + 1) * 50) : 0,
      },
      riskExposure: { highRiskFields: pestOutbreaks, pestOutbreaks, weatherAnomalies },
    });
  } catch (error) { next(error); }
});

// GET /dashboard/notifications
router.get('/notifications', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page), l = Number(limit);
    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
      Notification.countDocuments({ userId: req.user!.id }),
    ]);
    res.json({ notifications, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) { next(error); }
});

// PATCH /dashboard/notifications/:id/read
router.patch('/notifications/:id/read', authGuard, async (req: AuthRequest, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $set: { readAt: new Date() } });
    res.json({ message: 'Notification marked as read' });
  } catch (error) { next(error); }
});

export default router;
