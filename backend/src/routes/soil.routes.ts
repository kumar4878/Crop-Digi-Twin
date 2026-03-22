import { Router } from 'express';
import { SoilReport } from '../models/SoilReport';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /soil/reports - Upload Soil Report
router.post('/reports', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const { fieldId, reportDate, testingLab, reportFile, manualEntry } = req.body;

    if (!fieldId || !reportDate || !testingLab) {
      throw new AppError(400, 'fieldId, reportDate, and testingLab are required');
    }

    const results = manualEntry || { ph: 0, nitrogen: 0, phosphorus: 0, potassium: 0 };

    // Auto-interpret soil data
    const interpretation = interpretSoilResults(results);
    const recommendations = generateFertilizerRecommendations(results);

    const report = await SoilReport.create({
      fieldId,
      reportDate: new Date(reportDate),
      testingLab,
      reportFile,
      results,
      interpretation,
      recommendations,
      createdBy: req.user!.id,
    });

    res.status(201).json({ reportId: report._id, interpretation, message: 'Soil report uploaded' });
  } catch (error) {
    next(error);
  }
});

// GET /soil/reports/field/:fieldId - Soil Reports by Field
router.get('/reports/field/:fieldId', authGuard, async (req, res, next) => {
  try {
    const { limit = 10, sort = 'desc' } = req.query;
    const reports = await SoilReport.find({ fieldId: req.params.fieldId })
      .sort({ reportDate: sort === 'asc' ? 1 : -1 })
      .limit(Number(limit));
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// GET /soil/recommendations/:fieldId - Fertilizer Recommendations
router.get('/recommendations/:fieldId', authGuard, async (req, res, next) => {
  try {
    const latestReport = await SoilReport.findOne({ fieldId: req.params.fieldId })
      .sort({ reportDate: -1 });

    if (!latestReport) {
      throw new AppError(404, 'No soil report found for this field');
    }

    res.json({
      fieldId: req.params.fieldId,
      reportDate: latestReport.reportDate,
      interpretation: latestReport.interpretation,
      recommendations: latestReport.recommendations,
    });
  } catch (error) {
    next(error);
  }
});

// Helper: Interpret soil results
function interpretSoilResults(results: any) {
  let phRating: string;
  if (results.ph < 5.5) phRating = 'ACIDIC';
  else if (results.ph < 6.5) phRating = 'SLIGHTLY_ACIDIC';
  else if (results.ph < 7.5) phRating = 'NEUTRAL';
  else if (results.ph < 8.5) phRating = 'SLIGHTLY_ALKALINE';
  else phRating = 'ALKALINE';

  const npkTotal = (results.nitrogen || 0) + (results.phosphorus || 0) + (results.potassium || 0);
  let npkRating: string;
  if (npkTotal < 100) npkRating = 'DEFICIENT';
  else if (npkTotal < 200) npkRating = 'LOW';
  else if (npkTotal < 400) npkRating = 'MEDIUM';
  else if (npkTotal < 600) npkRating = 'HIGH';
  else npkRating = 'EXCESSIVE';

  const overallScore = Math.min(100, Math.round(
    (results.ph >= 6 && results.ph <= 7.5 ? 40 : 20) +
    Math.min(30, (npkTotal / 600) * 30) +
    (results.organicCarbon ? Math.min(30, results.organicCarbon * 30) : 15)
  ));

  return { npkRating, phRating, overallScore };
}

// Helper: Generate fertilizer recommendations
function generateFertilizerRecommendations(results: any) {
  const fertilizers: any[] = [];
  const amendments: any[] = [];

  if (results.nitrogen < 200) {
    fertilizers.push({
      name: 'Urea',
      quantity: Math.round((200 - results.nitrogen) * 0.5),
      applicationStage: 'VEGETATIVE',
      notes: 'Apply in split doses during vegetative and flowering stages',
    });
  }

  if (results.phosphorus < 25) {
    fertilizers.push({
      name: 'SSP (Single Super Phosphate)',
      quantity: Math.round((25 - results.phosphorus) * 6),
      applicationStage: 'SOWING',
      notes: 'Apply as basal dose at the time of sowing',
    });
  }

  if (results.potassium < 150) {
    fertilizers.push({
      name: 'MOP (Muriate of Potash)',
      quantity: Math.round((150 - results.potassium) * 0.3),
      applicationStage: 'SOWING',
      notes: 'Apply as basal dose',
    });
  }

  if (results.ph < 5.5) {
    amendments.push({ type: 'LIME', quantity: 200, reason: 'Soil is too acidic. Application of lime will raise pH.' });
  } else if (results.ph > 8.5) {
    amendments.push({ type: 'GYPSUM', quantity: 150, reason: 'Soil is too alkaline. Gypsum will help lower pH.' });
  }

  if (!results.organicCarbon || results.organicCarbon < 0.5) {
    amendments.push({ type: 'ORGANIC_MATTER', quantity: 500, reason: 'Low organic carbon. Add compost or FYM.' });
  }

  return { fertilizers, amendments };
}

export default router;
