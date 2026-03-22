import { Router } from 'express';
import { PestIncident } from '../models/PestIncident';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /pest/report - Report Pest Incident
router.post('/report', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { fieldId, images, description, severity, affectedArea } = req.body;

    if (!fieldId || !images || images.length === 0) {
      throw new AppError(400, 'fieldId and at least one image are required');
    }

    // Mock AI pest detection (in production, call external AI endpoint)
    const aiResult = await identifyPest(images);

    const incident = await PestIncident.create({
      fieldId,
      reportedBy: req.user!.id,
      images: images.map((url: string) => ({ url, thumbnailUrl: url, uploadedAt: new Date() })),
      identification: {
        pestId: aiResult.pestId,
        pestName: aiResult.pestName,
        scientificName: aiResult.scientificName,
        confidence: aiResult.confidence,
        method: 'AI',
      },
      severity: severity || aiResult.severity,
      affectedArea: affectedArea || 0,
      symptoms: description ? [description] : [],
      treatment: { recommended: aiResult.treatment },
      reviewStatus: aiResult.confidence < 70 ? 'NEEDS_EXPERT' : 'APPROVED',
    });

    res.status(201).json({
      incidentId: incident._id,
      identification: incident.identification,
      treatment: incident.treatment.recommended,
      needsReview: aiResult.confidence < 70,
    });
  } catch (error) {
    next(error);
  }
});

// GET /pest/risk-score/:fieldId - Risk Score
router.get('/risk-score/:fieldId', authGuard, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const incidents = await PestIncident.find({
      fieldId: req.params.fieldId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const riskScore = Math.min(100, incidents.length * 15 +
      incidents.filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL').length * 20);

    res.json({
      fieldId: req.params.fieldId,
      riskScore,
      level: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
      incidentsLast30Days: incidents.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /pest/field/:fieldId - Pest Incidents by Field
router.get('/field/:fieldId', authGuard, async (req, res, next) => {
  try {
    const { status, limit = 20 } = req.query;
    const filter: any = { fieldId: req.params.fieldId };
    if (status) filter.status = status;

    const incidents = await PestIncident.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('reportedBy', 'name');

    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

// PATCH /pest/:id/status - Update Incident Status
router.patch('/:id/status', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const incident = await PestIncident.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
        },
      },
      { new: true }
    );
    if (!incident) throw new AppError(404, 'Pest incident not found');
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

// Mock AI Pest Detection Service
async function identifyPest(images: string[]) {
  // In production, this calls the actual AI model endpoint
  const pests = [
    {
      pestId: 'stem_borer', pestName: 'Stem Borer', scientificName: 'Scirpophaga incertulas',
      severity: 'HIGH' as const,
      treatment: [
        { productName: 'Chlorantraniliprole', activeIngredient: 'Chlorantraniliprole 18.5% SC', dosage: '60ml/acre', applicationMethod: 'Spray', safetyPeriod: 15 },
        { productName: 'Cartap Hydrochloride', activeIngredient: 'Cartap Hydrochloride 50% SP', dosage: '400g/acre', applicationMethod: 'Spray', safetyPeriod: 21 },
      ],
    },
    {
      pestId: 'leaf_curl', pestName: 'Leaf Curling Virus', scientificName: 'Tomato Leaf Curl Virus',
      severity: 'MEDIUM' as const,
      treatment: [
        { productName: 'Imidacloprid', activeIngredient: 'Imidacloprid 17.8% SL', dosage: '100ml/acre', applicationMethod: 'Spray', safetyPeriod: 14 },
      ],
    },
    {
      pestId: 'aphid', pestName: 'Aphids', scientificName: 'Aphis gossypii',
      severity: 'LOW' as const,
      treatment: [
        { productName: 'Thiamethoxam', activeIngredient: 'Thiamethoxam 25% WG', dosage: '40g/acre', applicationMethod: 'Spray', safetyPeriod: 7 },
      ],
    },
  ];

  const selected = pests[Math.floor(Math.random() * pests.length)];
  return { ...selected, confidence: 65 + Math.floor(Math.random() * 30) };
}

export default router;
