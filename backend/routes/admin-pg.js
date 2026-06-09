import express from 'express';
import db from '../config/database.js';
import { verifyAdmin } from '../middleware/verifyToken.js';
import bcrypt from 'bcrypt';

const router = express.Router();
router.use(verifyAdmin);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ──────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM public.users) AS total_users,
        (SELECT COUNT(*) FROM public.assessments) AS total_assessments,
        (SELECT COUNT(*) FROM public.assessments WHERE status = 'completed') AS completed_assessments,
        (SELECT COUNT(*) FROM public.assessments WHERE status = 'in_progress') AS in_progress_assessments,
        (SELECT COUNT(*) FROM public.trial_organizations) AS total_trials,
        (SELECT COUNT(*) FROM public.trial_organizations WHERE status = 'pending') AS pending_trials,
        (SELECT COUNT(*) FROM public.trial_organizations WHERE status = 'active') AS active_trials,
        (SELECT COUNT(*) FROM public.users WHERE created_at > now() - interval '7 days') AS new_users_7days,
        (SELECT COUNT(*) FROM public.assessments WHERE status = 'completed' AND completed_at > now() - interval '7 days') AS completed_7days
    `);

    const avgScoresResult = await db.query(`
      SELECT skill_category, ROUND(AVG(score)::numeric, 2) AS avg_score
      FROM public.assessment_results
      GROUP BY skill_category
      ORDER BY avg_score DESC
    `);

    const completionTimeResult = await db.query(`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60)::numeric, 0) AS avg_minutes
      FROM public.assessments
      WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL
    `);

    const s = statsResult.rows[0];
    const categoryAverages = {};
    for (const row of avgScoresResult.rows) {
      categoryAverages[row.skill_category] = row.avg_score;
    }

    res.json({
      success: true,
      stats: {
        totalUsers:             parseInt(s.total_users || 0),
        totalAssessments:       parseInt(s.total_assessments || 0),
        completedAssessments:   parseInt(s.completed_assessments || 0),
        inProgressAssessments:  parseInt(s.in_progress_assessments || 0),
        abandonedAssessments:   0,
        avgCompletionTime:      parseInt(completionTimeResult.rows[0]?.avg_minutes || 0),
        categoryAverages,
        newUsersLast7Days:      parseInt(s.new_users_7days || 0),
        completedLast7Days:     parseInt(s.completed_7days || 0),
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ──────────────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id, u.email, u.full_name, u.role, u.is_active,
        u.created_at, u.last_login, u.supabase_id,
        COUNT(a.id)          AS assessment_count,
        MAX(a.total_score)   AS score_massimo,
        MAX(a.completed_at)  AS ultimo_completamento
      FROM public.users u
      LEFT JOIN public.assessments a ON a.user_id = u.supabase_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(u => ({
      id:                   u.id,
      email:                u.email,
      full_name:            u.full_name,
      created_at:           u.created_at,
      assessmentCount:      parseInt(u.assessment_count || 0),
      last_assessment_date: u.ultimo_completamento || null,
      is_blocked:           !u.is_active,
      role:                 u.role,
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// ──────────────────────────────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await db.query(
      'SELECT id, email, full_name, role, is_active, created_at, last_login, supabase_id FROM public.users WHERE id = $1',
      [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }
    const user = userResult.rows[0];
    const assessmentsResult = await db.query(
      'SELECT id, status, total_score, started_at, completed_at, created_at FROM public.assessments WHERE user_id = $1 ORDER BY created_at DESC',
      [user.supabase_id]
    );
    res.json({ success: true, user, assessments: assessmentsResult.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/create
// ──────────────────────────────────────────────────────────────────────────────
router.post('/users/create', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email e password obbligatorie' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimo 6 caratteri' });
    }
    const existing = await db.query('SELECT id FROM public.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email già registrata' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO public.users (email, full_name, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'user', true, now(), now()) RETURNING id, email, full_name`,
      [email, fullName || null, hash]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/block
// ──────────────────────────────────────────────────────────────────────────────
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    const result = await db.query(
      'UPDATE public.users SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, email, is_active',
      [!blocked, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }
    res.json({ success: true, message: blocked ? 'Utente disattivato' : 'Utente attivato', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/password
// ──────────────────────────────────────────────────────────────────────────────
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimo 6 caratteri' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE public.users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [hash, id]
    );
    res.json({ success: true, message: 'Password aggiornata' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ──────────────────────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await db.query('SELECT * FROM public.users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }
    if (userResult.rows[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Non è possibile eliminare un account admin' });
    }
    const supabaseId = userResult.rows[0].supabase_id;
    if (supabaseId) {
      const assessmentsResult = await db.query('SELECT id FROM public.assessments WHERE user_id = $1', [supabaseId]);
      if (assessmentsResult.rows.length > 0) {
        const ids = assessmentsResult.rows.map(a => a.id);
        await db.query('DELETE FROM public.assessment_results WHERE assessment_id = ANY($1)', [ids]);
        await db.query('DELETE FROM public.assessments WHERE user_id = $1', [supabaseId]);
      }
    }
    await db.query('UPDATE public.users SET is_active = false, updated_at = now() WHERE id = $1', [id]);
    res.json({ success: true, message: 'Utente disattivato' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/assessments
// ──────────────────────────────────────────────────────────────────────────────
router.get('/assessments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.id, a.status, a.total_score, a.started_at, a.completed_at, a.created_at,
        a.user_id,
        u.full_name, u.email
      FROM public.assessments a
      JOIN public.users u ON u.supabase_id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 200
    `);

    const assessments = result.rows.map(a => ({
      id:          a.id,
      user_id:     a.user_id,
      status:      a.status,
      total_score: a.total_score,
      started_at:  a.started_at,
      created_at:  a.created_at,
      completed_at: a.completed_at,
      userName:    a.full_name || a.email || 'N/A',
      userEmail:   a.email || '',
    }));

    res.json({ success: true, assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/assessments/:id
// ──────────────────────────────────────────────────────────────────────────────
router.delete('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM public.assessment_results WHERE assessment_id = $1', [id]);
    await db.query('DELETE FROM public.assessments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Assessment eliminato' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/trials
// ──────────────────────────────────────────────────────────────────────────────
router.get('/trials', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, organization_name, contact_name, contact_email,
             company_size, status, trial_end_date, created_at, notes
      FROM public.trial_organizations
      ORDER BY created_at DESC
    `);

    const trials = result.rows.map(t => ({
      id:                t.id,
      company_name:      t.organization_name,
      contact_name:      t.contact_name,
      contact_email:     t.contact_email,
      phone:             null,
      employees:         t.company_size || null,
      sector:            null,
      assessment_quota:  20,
      used_assessments:  0,
      expires_at:        t.trial_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status:            t.status,
      created_at:        t.created_at,
      activated_at:      null,
      notes:             t.notes,
    }));

    res.json({ success: true, trials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/trials/:id/status
// ──────────────────────────────────────────────────────────────────────────────
router.put('/trials/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.query(
      'UPDATE public.trial_organizations SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json({ success: true, trial: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/trials/:id/activate
// ──────────────────────────────────────────────────────────────────────────────
router.post('/trials/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const { assessment_quota = 20, days = 30 } = req.body;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const result = await db.query(
      `UPDATE public.trial_organizations
       SET status = 'active', trial_end_date = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, organization_name, contact_email, status`,
      [expiresAt, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trial non trovato' });
    }
    res.json({ success: true, trial: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/trials/:id
// ──────────────────────────────────────────────────────────────────────────────
router.delete('/trials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM public.trial_organizations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Trial eliminato' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/emails/send  (placeholder — integrate your mail provider here)
// ──────────────────────────────────────────────────────────────────────────────
router.post('/emails/send', async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;
    if (!recipients?.length || !subject || !body) {
      return res.status(400).json({ success: false, message: 'recipients, subject e body obbligatori' });
    }
    // TODO: integrate nodemailer / SendGrid / Resend
    console.log(`[Admin Email] A: ${recipients.join(', ')} | Oggetto: ${subject}`);
    res.json({ success: true, sent: recipients.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
