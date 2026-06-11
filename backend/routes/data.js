/**
 * /api/data — Tutte le operazioni dati che il frontend faceva
 * direttamente su Supabase. Richiede autenticazione JWT.
 *
 * Montato in server.js come: app.use('/api/data', dataRouter)
 */

import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Tutti gli endpoint richiedono JWT
router.use(verifyToken);

// ── Helper ───────────────────────────────────────────────────────────────────

// Usa supabase_id se disponibile (utenti migrati), altrimenti id locale
const userId = req => req.user.supabase_id ?? req.user.id;

// ── USER PROFILE ─────────────────────────────────────────────────────────────

/** GET /api/data/profile */
router.get('/profile', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, full_name, is_admin, is_blocked, role, industry, seniority FROM user_profiles WHERE id = $1',
      [userId(req)]
    );
    // Se il profilo non esiste ancora, restituisci i dati dall'utente JWT
    const profile = rows[0] ?? {
      id:        userId(req),
      full_name: req.user.full_name ?? null,
      is_admin:  req.user.role === 'admin',
      is_blocked: false
    };
    res.json({ success: true, profile });
  } catch (err) { next(err); }
});

/** PUT /api/data/profile */
router.put('/profile', async (req, res, next) => {
  try {
    const { full_name, role, industry, seniority } = req.body;
    await db.query(
      `INSERT INTO user_profiles (id, full_name, role, industry, seniority)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             role      = EXCLUDED.role,
             industry  = EXCLUDED.industry,
             seniority = EXCLUDED.seniority,
             updated_at = NOW()`,
      [userId(req), full_name, role, industry, seniority]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── ASSESSMENTS ───────────────────────────────────────────────────────────────

/** GET /api/data/assessments — lista assessment dell'utente */
router.get('/assessments', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, status, total_score, created_at, completed_at
       FROM assessments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId(req)]
    );
    res.json({ success: true, assessments: rows });
  } catch (err) { next(err); }
});

/** POST /api/data/assessments — crea nuovo assessment con set randomizzato */
router.post('/assessments', async (req, res, next) => {
  try {
    const uid = userId(req);
    const { focus_config_id } = req.body;

    let questionSet, assessmentType = 'base', targetSkills = null;

    if (focus_config_id) {
      // Assessment Focus: set fisso A, competenze dal config
      const cfgRes = await db.query(
        'SELECT skills FROM focus_configs WHERE id = $1',
        [focus_config_id]
      );
      if (!cfgRes.rows.length) {
        return res.status(404).json({ success: false, message: 'Focus config non trovato' });
      }
      questionSet = 'A';
      assessmentType = 'focus';
      targetSkills = cfgRes.rows[0].skills;
    } else {
      // Assessment base: set randomizzato escludendo l'ultimo usato
      const lastResult = await db.query(
        `SELECT question_set FROM assessments
         WHERE user_id = $1 AND status = 'completed'
         ORDER BY completed_at DESC LIMIT 1`,
        [uid]
      );
      const lastSet = lastResult.rows[0]?.question_set ?? null;
      const allSets = ['A', 'B', 'C'];
      const available = lastSet ? allSets.filter(s => s !== lastSet) : allSets;
      questionSet = available[Math.floor(Math.random() * available.length)];
    }

    const { rows } = await db.query(
      `INSERT INTO assessments (user_id, status, question_set, assessment_type, target_skills)
       VALUES ($1, 'in_progress', $2, $3, $4)
       RETURNING id, status, question_set, assessment_type, target_skills, created_at`,
      [uid, questionSet, assessmentType, targetSkills]
    );
    res.status(201).json({ success: true, assessment: rows[0] });
  } catch (err) { next(err); }
});

/** GET /api/data/assessments/in-progress — primo assessment in corso */
router.get('/assessments/in-progress', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM assessments
       WHERE user_id = $1 AND status = 'in_progress'
       ORDER BY created_at DESC LIMIT 1`,
      [userId(req)]
    );
    res.json({ success: true, assessment: rows[0] ?? null });
  } catch (err) { next(err); }
});

/** GET /api/data/assessments/:id */
router.get('/assessments/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM assessments WHERE id = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Assessment non trovato' });
    res.json({ success: true, assessment: rows[0] });
  } catch (err) { next(err); }
});

/** DELETE /api/data/assessments/:id — elimina con cascade */
router.delete('/assessments/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    // Le FK con ON DELETE CASCADE eliminano automaticamente le righe figlie
    await db.query('DELETE FROM assessments WHERE id = $1 AND user_id = $2', [id, userId(req)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── ASSESSMENT RESPONSES ──────────────────────────────────────────────────────

/** GET /api/data/assessments/:id/responses */
router.get('/assessments/:id/responses', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM assessment_responses WHERE assessment_id = $1',
      [req.params.id]
    );
    res.json({ success: true, responses: rows });
  } catch (err) { next(err); }
});

/** GET /api/data/assessments/:id/responses/count */
router.get('/assessments/:id/responses/count', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT COUNT(*) AS count FROM assessment_responses WHERE assessment_id = $1',
      [req.params.id]
    );
    res.json({ success: true, count: parseInt(rows[0].count) });
  } catch (err) { next(err); }
});

/** POST /api/data/assessments/:id/responses — upsert singola risposta (Likert o profiling) */
router.post('/assessments/:id/responses', async (req, res, next) => {
  try {
    const { question_id, answer_value, answer_text, skill_category } = req.body;
    await db.query(
      `INSERT INTO assessment_responses (assessment_id, user_id, question_id, answer_value, answer_text, skill_category)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (assessment_id, question_id)
       DO UPDATE SET answer_value = EXCLUDED.answer_value,
                     answer_text  = EXCLUDED.answer_text`,
      [req.params.id, userId(req), question_id, answer_value ?? null, answer_text ?? null, skill_category]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/** PUT /api/data/assessments/:id/user-context — salva user_context JSONB */
router.put('/assessments/:id/user-context', async (req, res, next) => {
  try {
    const { user_context } = req.body;
    await db.query(
      `UPDATE assessments SET user_context = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(user_context), req.params.id, userId(req)]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/** PUT /api/data/assessments/:id/complete — segna come completato e calcola combined results */
router.put('/assessments/:id/complete', async (req, res, next) => {
  try {
    const { total_score } = req.body;
    const assessmentId = req.params.id;

    // 1. Aggiorna lo stato dell'assessment
    const { rows } = await db.query(
      `UPDATE assessments
       SET status = 'completed', total_score = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [total_score, assessmentId, userId(req)]
    );

    // 2. Calcola e inserisce combined_assessment_results (Likert 70% + SJT 30%)
    try {
      const [likertRes, sjtRes] = await Promise.all([
        db.query('SELECT skill_category, score FROM assessment_results WHERE assessment_id = $1', [assessmentId]),
        db.query('SELECT skill_weights FROM situational_responses WHERE assessment_id = $1', [assessmentId]),
      ]);

      // Somma i pesi SJT per skill
      const sjtTotals = {};
      const sjtCounts = {};
      for (const row of sjtRes.rows) {
        const weights = row.skill_weights || {};
        for (const [skill, weight] of Object.entries(weights)) {
          sjtTotals[skill] = (sjtTotals[skill] ?? 0) + Number(weight);
          sjtCounts[skill] = (sjtCounts[skill] ?? 0) + 1;
        }
      }
      const numSjtQuestions = sjtRes.rows.length;

      for (const { skill_category, score } of likertRes.rows) {
        const likertScore = parseFloat(score);
        // SJT normalizzato su scala 0-5 (peso massimo 3 per domanda)
        const sjtRaw = sjtTotals[skill_category] ?? 0;
        const sjtScore = numSjtQuestions > 0
          ? Math.min((sjtRaw / (3 * numSjtQuestions)) * 5, 5)
          : 0;
        const finalScore = parseFloat((likertScore * 0.7 + sjtScore * 0.3).toFixed(2));

        await db.query(
          `INSERT INTO combined_assessment_results
             (assessment_id, skill_category, likert_score, sjt_score, final_score)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (assessment_id, skill_category)
           DO UPDATE SET likert_score = EXCLUDED.likert_score,
                         sjt_score    = EXCLUDED.sjt_score,
                         final_score  = EXCLUDED.final_score`,
          [assessmentId, skill_category, likertScore, parseFloat(sjtScore.toFixed(2)), finalScore]
        );
      }
    } catch (calcErr) {
      // Non blocca la risposta se il calcolo fallisce — l'assessment è già completato
      console.error('combined_assessment_results calc error:', calcErr);
    }

    res.json({ success: true, assessment: rows[0] });
  } catch (err) { next(err); }
});

// ── ASSESSMENT RESULTS ────────────────────────────────────────────────────────

/** GET /api/data/assessments/:id/results */
router.get('/assessments/:id/results', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM combined_assessment_results WHERE assessment_id = $1 ORDER BY final_score DESC',
      [req.params.id]
    );
    res.json({ success: true, results: rows });
  } catch (err) { next(err); }
});

/** POST /api/data/assessments/:id/results — upsert risultati */
router.post('/assessments/:id/results', async (req, res, next) => {
  try {
    const { results } = req.body; // array di { skill_category, score, ... }
    for (const r of results) {
      await db.query(
        `INSERT INTO assessment_results (assessment_id, skill_category, score, percentile, strengths, improvements)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (assessment_id, skill_category)
         DO UPDATE SET score = EXCLUDED.score`,
        [req.params.id, r.skill_category, r.score, r.percentile, r.strengths, r.improvements]
      );
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── QUALITATIVE REPORT ────────────────────────────────────────────────────────

/** GET /api/data/assessments/:id/report — hr_notes escluso (visibile solo HR) */
router.get('/assessments/:id/report', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, assessment_id, user_id, profile_insights, category_interpretations,
              development_plan, ai_model, generation_tokens, created_at
       FROM qualitative_reports WHERE assessment_id = $1`,
      [req.params.id]
    );
    res.json({ success: true, report: rows[0] ?? null });
  } catch (err) { next(err); }
});

// ── LEADERSHIP ────────────────────────────────────────────────────────────────

/** GET /api/data/leadership — lista leadership assessments dell'utente */
router.get('/leadership', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, status, total_score, created_at, completed_at
       FROM leadership_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId(req)]
    );
    res.json({ success: true, assessments: rows });
  } catch (err) { next(err); }
});

/** DELETE /api/data/leadership/:id */
router.delete('/leadership/:id', async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM leadership_assessments WHERE id = $1 AND user_id = $2',
      [req.params.id, userId(req)]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/** GET /api/data/leadership/:id/responses */
router.get('/leadership/:id/responses', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT question_id, answer FROM leadership_responses WHERE assessment_id = $1',
      [req.params.id]
    );
    res.json({ success: true, responses: rows });
  } catch (err) { next(err); }
});

/** GET /api/data/leadership/:id/responses/count */
router.get('/leadership/:id/responses/count', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT COUNT(*) AS count FROM leadership_responses WHERE assessment_id = $1',
      [req.params.id]
    );
    res.json({ success: true, count: parseInt(rows[0].count) });
  } catch (err) { next(err); }
});

export default router;
