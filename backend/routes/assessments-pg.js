import express from 'express';
import db from '../config/database.js';
import {
  calculateCategoryScores,
  identifyStrengthsAndImprovements,
  calculateOverallScore,
} from '../utils/scoring.js';

const router = express.Router();

router.post('/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;

    const responsesResult = await db.query(
      'SELECT question_id, answer FROM assessment_responses WHERE assessment_id = $1',
      [id]
    );
    const responses = responsesResult.rows;

    if (!responses || responses.length !== 48) {
      return res.status(400).json({
        error: 'Assessment incomplete',
        message: `Only ${responses?.length || 0} of 48 questions answered`,
      });
    }

    const categoryScores = calculateCategoryScores(responses);
    const overallScore = calculateOverallScore(categoryScores);
    const { strengths, improvements } = identifyStrengthsAndImprovements(categoryScores);

    const resultsToInsert = categoryScores.map(cat => ({
      assessment_id: id,
      skill_category: cat.skill_category,
      score: cat.score,
      strengths,
      improvements
    }));

    for (const result of resultsToInsert) {
      await db.query(
        `INSERT INTO assessment_results (assessment_id, skill_category, score, strengths, improvements)
         VALUES ($1, $2, $3, $4, $5)`,
        [result.assessment_id, result.skill_category, result.score, result.strengths, result.improvements]
      );
    }

    await db.query(
      `UPDATE assessments SET total_score = $1, status = 'completed', completed_at = NOW() WHERE id = $2`,
      [overallScore, id]
    );

    res.json({
      success: true,
      overallScore,
      categoryScores,
      strengths,
      improvements,
      message: 'Assessment scored successfully',
    });
  } catch (error) {
    console.error('Error calculating assessment scores:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;
