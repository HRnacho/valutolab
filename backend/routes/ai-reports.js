import express from 'express';
import { generateQualitativeReport, getQualitativeReport } from '../services/ai-report-generator.js';

const router = express.Router();

/**
 * POST /api/ai-reports/generate/:assessmentId
 * Genera un nuovo report qualitativo per un assessment
 */
router.post('/generate/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    console.log(`📝 Request to generate AI report for assessment: ${assessmentId}`);

    // Verifica se esiste già un report
    const existingReport = await getQualitativeReport(assessmentId);
    
    if (existingReport) {
      console.log(`✅ Report already exists, returning cached version`);
      return res.json({
        success: true,
        report: existingReport,
        cached: true
      });
    }

    // Genera nuovo report
    const report = await generateQualitativeReport(assessmentId);

    res.json({
      success: true,
      report,
      cached: false
    });
  } catch (error) {
    console.error('❌ Error in generate AI report endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-reports/:assessmentId
 * Recupera un report qualitativo esistente
 */
router.get('/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const report = await getQualitativeReport(assessmentId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error fetching AI report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-reports/regenerate/:assessmentId
 * Rigenera un report anche se esiste già
 */
router.post('/regenerate/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    console.log(`🔄 Request to regenerate AI report for assessment: ${assessmentId}`);

    // Elimina report esistente se presente
    const existingReport = await getQualitativeReport(assessmentId);
    if (existingReport) {
      // TODO: Implementare delete se necessario
      console.log('Existing report will be overwritten');
    }

    // Genera nuovo report
    const report = await generateQualitativeReport(assessmentId);

    res.json({
      success: true,
      report,
      regenerated: true
    });
  } catch (error) {
    console.error('❌ Error regenerating AI report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;