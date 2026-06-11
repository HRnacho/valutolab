import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { Resend } from 'resend';
import { categoryLabels } from '../data/questions.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

// POST /api/organizations/create
router.post('/create', async (req, res) => {
  try {
    const { userId, name, partitaIva, referentName, referentRole, contactEmail } = req.body;

    if (!userId || !name || !contactEmail) {
      return res.status(400).json({ success: false, message: 'Campi obbligatori: userId, name, contactEmail' });
    }

    const result = await db.query(
      `INSERT INTO organizations 
       (name, contact_email, partita_iva, referent_name, referent_role, subscription_tier, subscription_status, assessment_quota, used_assessments)
       VALUES ($1, $2, $3, $4, $5, 'starter', 'active', 20, 0)
       RETURNING *`,
      [name, contactEmail, partitaIva, referentName, referentRole]
    );
    const org = result.rows[0];

    await db.query(
      `INSERT INTO organization_members 
       (organization_id, user_id, role, can_view_results, can_create_invites, can_manage_members)
       VALUES ($1, $2, 'owner', true, true, true)`,
      [org.id, userId]
    );

    res.json({ success: true, organization: org, message: 'Organizzazione creata con successo' });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ success: false, message: 'Errore nella creazione', error: error.message });
  }
});

// GET /api/organizations/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT om.*, o.* FROM organization_members om
       JOIN organizations o ON om.organization_id = o.id
       WHERE om.user_id = $1`,
      [userId]
    );
    res.json({
      success: true,
      organizations: result.rows.map(r => ({
        id: r.organization_id,
        name: r.name,
        contact_email: r.contact_email,
        role: r.role,
        permissions: {
          can_view_results: r.can_view_results,
          can_create_invites: r.can_create_invites,
          can_manage_members: r.can_manage_members
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero', error: error.message });
  }
});

// GET /api/organizations/my — orgs dove l'utente è owner
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.supabase_id ?? req.user.id
    const { rows } = await db.query(
      `SELECT o.id, o.name FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.role = 'owner'
       ORDER BY o.created_at ASC`,
      [userId]
    )
    res.json({ success: true, organizations: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/organizations/:orgId
router.get('/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const result = await db.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Organizzazione non trovata' });
    const org = result.rows[0];

    const memberCount = await db.query('SELECT COUNT(*) FROM organization_members WHERE organization_id = $1', [orgId]);
    const inviteCount = await db.query('SELECT COUNT(*) FROM candidate_invites WHERE organization_id = $1', [orgId]);
    const completedCount = await db.query("SELECT COUNT(*) FROM candidate_invites WHERE organization_id = $1 AND status = 'completed'", [orgId]);

    res.json({
      success: true,
      organization: {
        ...org,
        stats: {
          members: parseInt(memberCount.rows[0].count),
          invites: parseInt(inviteCount.rows[0].count),
          completed: parseInt(completedCount.rows[0].count),
          quota_remaining: org.assessment_quota - org.used_assessments
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero', error: error.message });
  }
});

// POST /api/organizations/:orgId/invite
router.post('/:orgId/invite', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { userId, candidateEmail, candidateName, assessmentType, notes, focus_config_id } = req.body;

    if (!candidateEmail) return res.status(400).json({ success: false, message: 'Email candidato obbligatoria' });

    const orgResult = await db.query('SELECT assessment_quota, used_assessments FROM organizations WHERE id = $1', [orgId]);
    const org = orgResult.rows[0];
    if (org.used_assessments >= org.assessment_quota) {
      return res.status(403).json({ success: false, message: 'Quota mensile assessment esaurita' });
    }

    const memberResult = await db.query(
      'SELECT can_create_invites FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    if (!memberResult.rows[0]?.can_create_invites) {
      return res.status(403).json({ success: false, message: 'Non hai i permessi per invitare candidati' });
    }

    const orgNameRes = await db.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    const orgName = orgNameRes.rows[0]?.name || '';

    const result = await db.query(
      `INSERT INTO candidate_invites
       (organization_id, invited_by, candidate_email, candidate_name, assessment_type, notes, status, focus_config_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [orgId, userId, candidateEmail, candidateName, assessmentType || 'internal', notes, focus_config_id || null]
    );

    const invite = result.rows[0];
    const assessmentUrl = `${process.env.FRONTEND_URL}/invito/${invite.invite_token}`;

    // Blocco Focus: recupera skill in italiano se presente
    let focusBlock = '';
    if (focus_config_id) {
      try {
        const cfgRes = await db.query('SELECT skills FROM focus_configs WHERE id = $1', [focus_config_id]);
        const skills = cfgRes.rows[0]?.skills ?? [];
        if (skills.length > 0) {
          const skillNames = skills.map(s => categoryLabels[s] || s).join(', ');
          focusBlock = `
            <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; border-radius: 4px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #3730A3; font-weight: bold;">🎯 Assessment focalizzato su:</p>
              <p style="margin: 6px 0 0; color: #1F2937;">${skillNames}</p>
            </div>`;
        }
      } catch (err) {
        console.error('Focus config fetch error:', err);
      }
    }

    try {
      await resend.emails.send({
        from: 'ValutoLab <info@valutolab.com>',
        to: candidateEmail,
        subject: 'Sei stato invitato a completare un assessment ValutoLab',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #4F46E5;">ValutoLab</h1>
            </div>

            <h2>Ciao ${candidateName || candidateEmail}! 👋</h2>

            <p><strong>${orgName}</strong> ti ha invitato a completare un assessment professionale delle soft skills.</p>

            ${focusBlock}

            <div style="background: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">📋 Cosa ti aspetta</h3>
              <p>✅ <strong>Domande</strong> di autovalutazione</p>
              <p>✅ <strong>15 minuti</strong> per completarlo</p>
              <p>✅ <strong>Report personalizzato</strong> delle tue competenze</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${assessmentUrl}"
                 style="background: #4F46E5; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold;">
                Inizia l'Assessment →
              </a>
            </div>

            <p style="color: #6B7280; font-size: 14px;">
              Se il bottone non funziona, copia questo link nel browser:<br/>
              <a href="${assessmentUrl}">${assessmentUrl}</a>
            </p>

            <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
              Hai ricevuto questa email perché ${orgName} ti ha invitato tramite ValutoLab.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    res.json({ success: true, invite, message: 'Invito creato e email inviata al candidato' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nella creazione', error: error.message });
  }
});

// GET /api/organizations/:orgId/invites
router.get('/:orgId/invites', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status } = req.query;

    let query = `SELECT ci.*, a.id as assessment_id, a.total_score, a.completed_at as assessment_completed_at,
                        fc.name as focus_config_name, fc.skills as focus_config_skills
                 FROM candidate_invites ci
                 LEFT JOIN assessments a ON ci.assessment_id = a.id
                 LEFT JOIN focus_configs fc ON ci.focus_config_id = fc.id
                 WHERE ci.organization_id = $1`;
    const values = [orgId];

    if (status) { query += ` AND ci.status = $2`; values.push(status); }
    query += ' ORDER BY ci.created_at DESC';

    const result = await db.query(query, values);
    res.json({ success: true, invites: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero', error: error.message });
  }
});

// GET /api/organizations/invite/:token/validate
router.get('/invite/:token/validate', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await db.query(
      `SELECT ci.*, o.name as organization_name 
       FROM candidate_invites ci
       JOIN organizations o ON ci.organization_id = o.id
       WHERE ci.invite_token = $1`,
      [token]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Invito non trovato' });

    const invite = result.rows[0];
    const isExpired = new Date(invite.expires_at) < new Date();
    const isCompleted = invite.status === 'completed';

    res.json({
      success: true,
      invite: {
        valid: !isExpired && !isCompleted,
        expired: isExpired,
        completed: isCompleted,
        candidate_name: invite.candidate_name,
        organization_name: invite.organization_name,
        assessment_type: invite.assessment_type,
        focus_config_id: invite.focus_config_id || null
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Invito non trovato o non valido' });
  }
});

// POST /api/organizations/invite/:token/complete
router.post('/invite/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const { assessmentId } = req.body;

    await db.query(
      `UPDATE candidate_invites SET status = 'completed', completed_at = NOW(), assessment_id = $1 WHERE invite_token = $2`,
      [assessmentId, token]
    );

    const inviteResult = await db.query('SELECT organization_id FROM candidate_invites WHERE invite_token = $1', [token]);
    const orgId = inviteResult.rows[0].organization_id;

    await db.query('UPDATE organizations SET used_assessments = used_assessments + 1 WHERE id = $1', [orgId]);

    res.json({ success: true, message: 'Invito completato con successo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel completamento', error: error.message });
  }
});

// GET /api/organizations/:orgId/candidates-with-scores
router.get('/:orgId/candidates-with-scores', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { rows } = await db.query(
      `SELECT
         ci.id            AS invite_id,
         ci.candidate_name,
         ci.candidate_email,
         ci.completed_at,
         ci.created_at    AS invite_date,
         ci.focus_config_id,
         a.id             AS assessment_id,
         a.total_score,
         a.question_set,
         json_object_agg(car.skill_category, car.final_score) AS scores
       FROM candidate_invites ci
       JOIN assessments a              ON ci.assessment_id = a.id
       JOIN combined_assessment_results car ON a.id = car.assessment_id
       WHERE ci.organization_id = $1 AND ci.status = 'completed'
       GROUP BY ci.id, ci.candidate_name, ci.candidate_email,
                ci.completed_at, ci.created_at,
                a.id, a.total_score, a.question_set
       ORDER BY ci.candidate_name`,
      [orgId]
    );
    res.json({ success: true, candidates: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/organizations/:orgId/members
router.get('/:orgId/members', async (req, res) => {
  try {
    const { orgId } = req.params;
    const result = await db.query(
      `SELECT om.*, up.full_name, up.avatar_url 
       FROM organization_members om
       LEFT JOIN user_profiles up ON om.user_id = up.id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC`,
      [orgId]
    );
    res.json({ success: true, members: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero', error: error.message });
  }
});

export default router;
