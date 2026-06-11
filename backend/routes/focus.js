import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

const VALID_SKILLS = [
  'communication', 'leadership', 'problem_solving', 'teamwork',
  'time_management', 'adaptability', 'creativity', 'critical_thinking',
  'empathy', 'resilience', 'negotiation', 'decision_making'
];

const ownerUserId = (req) => req.user.supabase_id ?? req.user.id;

async function assertOwner(orgId, userId) {
  const { rows } = await db.query(
    `SELECT id FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND role = 'owner'`,
    [orgId, userId]
  );
  if (!rows.length) throw { status: 403, message: 'Accesso riservato agli owner dell\'organizzazione' };
}

// GET /api/focus/configs?org=<orgId>
router.get('/configs', verifyToken, async (req, res) => {
  try {
    const { org } = req.query;
    if (!org) return res.status(400).json({ success: false, message: 'Parametro org obbligatorio' });

    await assertOwner(org, ownerUserId(req));

    const { rows } = await db.query(
      `SELECT fc.*,
         COUNT(ci.id) FILTER (WHERE ci.status = 'completed') AS completed_count,
         COUNT(ci.id) AS total_invites
       FROM focus_configs fc
       LEFT JOIN candidate_invites ci ON ci.focus_config_id = fc.id
       WHERE fc.organization_id = $1
       GROUP BY fc.id
       ORDER BY fc.created_at DESC`,
      [org]
    );
    res.json({ success: true, configs: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/focus/configs
router.post('/configs', verifyToken, async (req, res) => {
  try {
    const { name, description, skills, organization_id } = req.body;
    const uid = ownerUserId(req);

    if (!name || !skills || !organization_id) {
      return res.status(400).json({ success: false, message: 'Campi obbligatori: name, skills, organization_id' });
    }
    if (!Array.isArray(skills) || skills.length < 1 || skills.length > 3) {
      return res.status(400).json({ success: false, message: 'Seleziona da 1 a 3 competenze' });
    }
    const invalid = skills.filter(s => !VALID_SKILLS.includes(s));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Competenze non valide: ${invalid.join(', ')}` });
    }

    await assertOwner(organization_id, uid);

    const { rows } = await db.query(
      `INSERT INTO focus_configs (organization_id, created_by, name, description, skills)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organization_id, uid, name, description || null, skills]
    );
    res.status(201).json({ success: true, config: rows[0] });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/focus/configs/:configId
router.get('/configs/:configId', verifyToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT fc.*,
         COUNT(ci.id) FILTER (WHERE ci.status = 'completed') AS completed_count,
         COUNT(ci.id) AS total_invites
       FROM focus_configs fc
       LEFT JOIN candidate_invites ci ON ci.focus_config_id = fc.id
       WHERE fc.id = $1
       GROUP BY fc.id`,
      [req.params.configId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Config non trovato' });

    await assertOwner(rows[0].organization_id, ownerUserId(req));

    res.json({ success: true, config: rows[0] });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/focus/configs/:configId
router.delete('/configs/:configId', verifyToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM focus_configs WHERE id = $1',
      [req.params.configId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Config non trovato' });

    await assertOwner(rows[0].organization_id, ownerUserId(req));

    const { rows: active } = await db.query(
      `SELECT id FROM candidate_invites
       WHERE focus_config_id = $1 AND status != 'completed'`,
      [req.params.configId]
    );
    if (active.length) {
      return res.status(409).json({ success: false, message: 'Impossibile eliminare: ci sono inviti attivi collegati a questo Focus' });
    }

    await db.query('DELETE FROM focus_configs WHERE id = $1', [req.params.configId]);
    res.json({ success: true, message: 'Focus config eliminato' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
