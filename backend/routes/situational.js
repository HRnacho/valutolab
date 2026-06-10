import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * GET /api/situational-questions?set=A
 * Recupera le domande situazionali attive per un dato set (A, B o C).
 * Se il parametro ?set è omesso restituisce tutte le domande attive.
 */
router.get('/situational-questions', async (req, res) => {
  try {
    const { set } = req.query;
    const params = [];
    let where = 'WHERE is_active = true';
    if (set) {
      params.push(set);
      where += ` AND question_set = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT * FROM situational_questions ${where} ORDER BY display_order ASC`,
      params
    );

    res.json({ success: true, questions: rows });
  } catch (error) {
    console.error('Error fetching situational questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/situational-responses
 * Salva le risposte dell'utente alle domande situazionali.
 *
 * Body: {
 *   assessmentId: UUID,
 *   userId: UUID,
 *   responses: [{ questionId: UUID, selectedOption: 'A'|'B'|'C'|'D' }]
 * }
 */
router.post('/situational-responses', verifyToken, async (req, res) => {
  try {
    const { assessmentId, userId, responses } = req.body;

    if (!assessmentId || !userId || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assessmentId, userId, responses',
      });
    }

    let saved = 0;

    for (const { questionId, selectedOption } of responses) {
      // Recupera i pesi dell'opzione selezionata dalla domanda
      const { rows } = await db.query(
        'SELECT options FROM situational_questions WHERE id = $1',
        [questionId]
      );

      if (!rows[0]) continue;

      const option = rows[0].options.find(o => o.label === selectedOption);
      if (!option) continue;

      await db.query(
        `INSERT INTO situational_responses
           (assessment_id, user_id, question_id, selected_option, skill_weights)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (assessment_id, question_id)
         DO UPDATE SET selected_option = EXCLUDED.selected_option,
                       skill_weights   = EXCLUDED.skill_weights`,
        [assessmentId, userId, questionId, selectedOption, JSON.stringify(option.skill_weights)]
      );
      saved++;
    }

    res.json({ success: true, saved });
  } catch (error) {
    console.error('Error saving situational responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assessments/:assessmentId/results-combined
 * Recupera i risultati combinati (Likert + SJT) con weighted blend.
 */
router.get('/assessments/:assessmentId/results-combined', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM combined_assessment_results
       WHERE assessment_id = $1
       ORDER BY final_score DESC`,
      [assessmentId]
    );

    const totalScore = rows.length
      ? rows.reduce((sum, r) => sum + parseFloat(r.final_score), 0) / rows.length
      : 0;

    res.json({
      success: true,
      results: rows,
      totalScore: parseFloat(totalScore.toFixed(2)),
    });
  } catch (error) {
    console.error('Error fetching combined results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assessments/:assessmentId/situational-responses
 * Recupera le risposte situazionali per un assessment.
 */
router.get('/assessments/:assessmentId/situational-responses', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { rows } = await db.query(
      'SELECT * FROM situational_responses WHERE assessment_id = $1',
      [assessmentId]
    );

    res.json({ success: true, responses: rows });
  } catch (error) {
    console.error('Error fetching situational responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
