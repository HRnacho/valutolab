import express from 'express';
import db from '../config/database.js';

const router = express.Router();

const categoryMap = {
  communication:         'Comunicazione',
  leadership:            'Leadership',
  problem_solving:       'Problem Solving',
  teamwork:              'Lavoro di Squadra',
  time_management:       'Gestione del Tempo',
  adaptability:          'Adattabilità',
  emotional_intelligence:'Intelligenza Emotiva',
  creativity:            'Creatività',
  critical_thinking:     'Pensiero Critico',
  empathy:               'Empatia',
  negotiation:           'Negoziazione',
  resilience:            'Resilienza',
  decision_making:       'Decision Making',
};
const fmt = (cat) => categoryMap[cat] || cat;

// ── POST /api/share/create ─────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { assessment_id } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'Non autenticato' });

    // Verifica assessment completato
    const aRes = await db.query(
      'SELECT id, user_id, status FROM assessments WHERE id = $1 AND status = $2',
      [assessment_id, 'completed']
    );
    if (!aRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Assessment non trovato o non completato' });
    }

    // Cerca condivisione esistente
    const existing = await db.query(
      'SELECT * FROM shared_profiles WHERE assessment_id = $1',
      [assessment_id]
    );
    if (existing.rows.length) {
      const share = existing.rows[0];
      if (!share.is_active) {
        const upd = await db.query(
          'UPDATE shared_profiles SET is_active = true WHERE id = $1 RETURNING *',
          [share.id]
        );
        return res.json({ success: true, ...upd.rows[0], message: 'Condivisione riattivata' });
      }
      return res.json({ success: true, ...share, message: 'Condivisione già esistente' });
    }

    // Crea nuova
    const ins = await db.query(
      `INSERT INTO shared_profiles (user_id, assessment_id, is_active)
       VALUES ($1, $2, true) RETURNING *`,
      [aRes.rows[0].user_id, assessment_id]
    );
    res.json({ success: true, ...ins.rows[0], message: 'Condivisione creata' });
  } catch (err) {
    console.error('share/create error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/share/status/:assessmentId ───────────────────────────────────
router.get('/status/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const r = await db.query(
      'SELECT * FROM shared_profiles WHERE assessment_id = $1',
      [assessmentId]
    );
    if (!r.rows.length) return res.json({ success: true, share: null });
    res.json({ success: true, ...r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/share/:token ──────────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const shareRes = await db.query(
      `SELECT sp.*, a.total_score, a.completed_at, a.user_id
       FROM shared_profiles sp
       JOIN assessments a ON a.id = sp.assessment_id
       WHERE sp.share_token = $1 AND sp.is_active = true`,
      [token]
    );
    if (!shareRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Profilo non trovato o condivisione disattivata' });
    }
    const share = shareRes.rows[0];

    const profileRes = await db.query(
      'SELECT full_name FROM users WHERE id = $1',
      [share.user_id]
    );

    const resultsRes = await db.query(
      `SELECT skill_category, final_score
       FROM combined_assessment_results
       WHERE assessment_id = $1`,
      [share.assessment_id]
    );

    const mappedResults = resultsRes.rows.map(r => ({
      category: fmt(r.skill_category),
      score: parseFloat(r.final_score),
    }));

    // Incrementa view count
    await db.query(
      'UPDATE shared_profiles SET view_count = view_count + 1, last_viewed_at = NOW() WHERE id = $1',
      [share.id]
    );

    res.json({
      success: true,
      profile: {
        name: profileRes.rows[0]?.full_name || 'Utente ValutoLab',
        completedAt: share.completed_at,
        totalScore: share.total_score,
        results: mappedResults,
      },
    });
  } catch (err) {
    console.error('share/:token error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/share/toggle/:token ──────────────────────────────────────────
router.put('/toggle/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { is_active } = req.body;

    const upd = await db.query(
      'UPDATE shared_profiles SET is_active = $1 WHERE share_token = $2 RETURNING *',
      [is_active, token]
    );
    if (!upd.rows.length) return res.status(404).json({ success: false, error: 'Condivisione non trovata' });
    res.json({ success: true, ...upd.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/share/:token ──────────────────────────────────────────────
router.delete('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    await db.query('DELETE FROM shared_profiles WHERE share_token = $1', [token]);
    res.json({ success: true, message: 'Condivisione eliminata' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
