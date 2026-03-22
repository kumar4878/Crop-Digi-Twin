import { Router } from 'express';
import { Farm } from '../models/Farm';
import { Field } from '../models/Field';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { authorize } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /farms - Create Farm
router.post('/', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { name, address, location, totalArea, ownershipType } = req.body;

    if (!name || !address || !location || !totalArea || !ownershipType) {
      throw new AppError(400, 'All fields are required');
    }

    const farm = await Farm.create({
      userId: req.user!.id,
      name,
      address,
      location,
      totalArea,
      ownershipType,
    });

    res.status(201).json({ farmId: farm._id, message: 'Farm created successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /farms - List Farms
router.get('/', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const filter: any = { userId: req.user!.id, deletedAt: { $exists: false } };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    // Admins/Managers can see all farms
    if (['ADMIN', 'SUPER_ADMIN', 'CXO', 'MANAGER'].includes(req.user!.role)) {
      delete filter.userId;
    }

    const [farms, total] = await Promise.all([
      Farm.find(filter)
        .select('name totalArea status address.district address.state')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Farm.countDocuments(filter),
    ]);

    // Get active field count per farm
    const farmIds = farms.map((f) => f._id);
    const fieldCounts = await Field.aggregate([
      { $match: { farmId: { $in: farmIds }, status: 'ACTIVE' } },
      { $group: { _id: '$farmId', count: { $sum: 1 }, avgHealth: { $avg: '$healthMetrics.ndvi' } } },
    ]);
    const fieldCountMap = new Map(fieldCounts.map((f: any) => [f._id.toString(), f]));

    const result = farms.map((farm) => {
      const fc = fieldCountMap.get(farm._id.toString());
      return {
        id: farm._id,
        name: farm.name,
        totalArea: farm.totalArea,
        activeFields: fc?.count || 0,
        healthScore: fc ? Math.round((fc.avgHealth + 1) * 50) : 0, // Normalize NDVI -1..1 to 0..100
        status: farm.status,
        district: farm.address?.district,
        state: farm.address?.state,
      };
    });

    res.json({
      farms: result,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /farms/:id - Farm Details
router.get('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm || farm.deletedAt) {
      throw new AppError(404, 'Farm not found');
    }

    const fields = await Field.find({ farmId: farm._id }).select('name area currentCrop healthMetrics status');

    res.json({ ...farm.toJSON(), fields });
  } catch (error) {
    next(error);
  }
});

// PATCH /farms/:id - Update Farm
router.patch('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: req.body },
      { new: true }
    );
    if (!farm) {
      throw new AppError(404, 'Farm not found or not authorized');
    }
    res.json(farm);
  } catch (error) {
    next(error);
  }
});

// DELETE /farms/:id - Soft Delete
router.delete('/:id', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { deletedAt: new Date(), status: 'INACTIVE' } },
      { new: true }
    );
    if (!farm) {
      throw new AppError(404, 'Farm not found or not authorized');
    }
    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
