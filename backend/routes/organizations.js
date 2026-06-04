import express from 'express';
import pg from 'pg';
import { Resend } from 'resend';

const router = express.Router();

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// ============================================
// 1. CREA ORGANIZZAZIONE
// ============================================
router.post('/create', async (req, res) => {
  try {
    const { userId, name, partitaIva, referentName, referentRole, contactEmail } = req.body;

    if (!userId || !name || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori: userId, name, contactEmail'
      });
    }

    const orgResult = await db.query(
      `INSERT INTO organizations 
         (name, contact_email, partita_iva, referent_name, referent_role, user_id,
          subscription_tier, subscription_status, assessment_quota, used_assessments)
       VALUES ($1, $2, $3, $4, $5, $6, 'starter', 'active', 20, 0)
       RETURNING *`,
      [name, contactEmail, partitaIva, referentName, referentRole, userId]
    );

    const org = orgResult.rows[0];

    await db.query(
      `INSERT INTO organization_members 
         (organization_id, user_id, role, can_view_results, can_create_invites, can_manage_members, joined_at)
       VALUES ($1, $2, 'owner', true, true, true, NOW())
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [org.id, userId]
    );

    res.json({
      success: true,
      organization: org,
      message: 'Organizzazione creata con successo'
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'organizzazione',
      error: error.message
    });
  }
});

// ============================================
// 2. GET ORGANIZZAZIONE UTENTE
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT 
         o.*,
         om.role,
         om.can_view_results,
         om.can_create_invites,
         om.can_manage_members
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      organizations: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        contact_email: row.contact_email,
        partita_iva: row.partita_iva,
        referent_name: row.referent_name,
        referent_role: row.referent_role,
        user_id: row.user_id,
        subscription_tier: row.subscription_tier,
        subscription_status: row.subscription_status,
        assessment_quota: row.assessment_quota,
        used_assessments: row.used_assessments,
        quota_reset_date: row.quota_reset_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        role: row.role,
        permissions: {
          can_view_results: row.can_view_results,
          can_create_invites: row.can_create_invites,
          can_manage_members: row.can_manage_members
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle organizzazioni',
      error: error.message
    });
  }
});

// ============================================
// 3. GET DETTAGLI ORGANIZZAZIONE
// ============================================
router.get('/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;

    const orgResult = await db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [orgId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organizzazione non trovata' });
    }

    const org = orgResult.rows[0];

    const memberCount = await db.query(
      'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1',
      [orgId]
    );

    const inviteCount = await db.query(
      'SELECT COUNT(*) FROM candidate_invites WHERE organization_id = $1',
      [orgId]
    );

    const completedCount = await db.query(
      "SELECT COUNT(*) FROM candidate_invites WHERE organization_id = $1 AND status = 'completed'",
      [orgId]
    );

    res.json({
      success: true,
      organization: {
        ...org,
        stats: {
          members: parseInt(memberCount.rows[0].count) || 0,
          invites: parseInt(inviteCount.rows[0].count) || 0,
          completed: parseInt(completedCount.rows[0].count) || 0,
          quota_remaining: org.assessment_quota - org.used_assessments
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'organizzazione',
      error: error.message
    });
  }
});

// ============================================
// 4. INVITA CANDIDATO/DIPENDENTE
// ============================================
router.post('/:orgId/invite', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { userId, candidateEmail, candidateName, assessmentType, notes } = req.body;

    if (!candidateEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email candidato obbligatoria'
      });
    }

    const orgResult = await db.query(
      'SELECT assessment_quota, used_assessments, name FROM organizations WHERE id = $1',
      [orgId]
    );

    const org = orgResult.rows[0];

    if (org.used_assessments >= org.assessment_quota) {
      return res.status(403).json({
        success: false,
        message: 'Quota mensile assessment esaurita'
      });
    }

    const memberResult = await db.query(
      'SELECT can_create_invites FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (memberResult.rows.length === 0 || !memberResult.rows[0].can_create_invites) {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per invitare candidati'
      });
    }

    const inviteResult = await db.query(
      `INSERT INTO candidate_invites 
         (organization_id, invited_by, candidate_email, candidate_name, assessment_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [orgId, userId, candidateEmail, candidateName, assessmentType || 'internal', notes]
    );

    const invite = inviteResult.rows[0];

    // Invia email al candidato
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const assessmentUrl = `https://valutolab.com/invito/${invite.invite_token}`;

      await resend.emails.send({
        from: 'ValutoLab <info@valutolab.com>',
        to: candidateEmail,
        subject: `📋 ${org.name} ti invita a completare un Assessment`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #4F46E5;">ValutoLab</h1>
            </div>

            <h2>Ciao ${candidateName || candidateEmail}! 👋</h2>

            <p><strong>${org.name}</strong> ti ha invitato a completare un assessment professionale delle soft skills.</p>

            <div style="background: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">📋 Cosa ti aspetta</h3>
              <p>✅ <strong>60 domande</strong> di autovalutazione</p>
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
              Hai ricevuto questa email perché ${org.name} ti ha invitato tramite ValutoLab.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Non blocchiamo la risposta se l'email fallisce
    }

    res.json({
      success: true,
      invite,
      message: 'Invito creato e email inviata al candidato'
    });

  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'invito',
      error: error.message
    });
  }
});

// ============================================
// 5. LISTA INVITI ORGANIZZAZIONE
// ============================================
router.get('/:orgId/invites', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT ci.*, a.id as assessment_id, a.total_score, a.completed_at as assessment_completed_at
      FROM candidate_invites ci
      LEFT JOIN assessments a ON a.id = ci.assessment_id
      WHERE ci.organization_id = $1
    `;
    const values = [orgId];

    if (status) {
      query += ` AND ci.status = $2`;
      values.push(status);
    }

    query += ' ORDER BY ci.created_at DESC';

    const result = await db.query(query, values);

    res.json({
      success: true,
      invites: result.rows
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli inviti',
      error: error.message
    });
  }
});

// ============================================
// 6. VALIDA INVITO (per pagina pubblica)
// ============================================
router.get('/invite/:token/validate', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT ci.*, o.name as organization_name
       FROM candidate_invites ci
       JOIN organizations o ON o.id = ci.organization_id
       WHERE ci.invite_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invito non trovato' });
    }

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
        assessment_type: invite.assessment_type
      }
    });

  } catch (error) {
    console.error('Error validating invite:', error);
    res.status(404).json({
      success: false,
      message: 'Invito non trovato o non valido'
    });
  }
});

// ============================================
// 7. COMPLETA INVITO (dopo assessment)
// ============================================
router.post('/invite/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const { assessmentId } = req.body;

    const inviteResult = await db.query(
      `UPDATE candidate_invites 
       SET status = 'completed', completed_at = NOW(), assessment_id = $1
       WHERE invite_token = $2
       RETURNING organization_id`,
      [assessmentId, token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invito non trovato' });
    }

    const orgId = inviteResult.rows[0].organization_id;

    await db.query(
      'UPDATE organizations SET used_assessments = used_assessments + 1 WHERE id = $1',
      [orgId]
    );

    res.json({
      success: true,
      message: 'Invito completato con successo'
    });

  } catch (error) {
    console.error('Error completing invite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel completamento dell\'invito',
      error: error.message
    });
  }
});

// ============================================
// 8. MEMBRI ORGANIZZAZIONE
// ============================================
router.get('/:orgId/members', async (req, res) => {
  try {
    const { orgId } = req.params;

    const result = await db.query(
      `SELECT om.*
       FROM organization_members om
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC`,
      [orgId]
    );

    res.json({
      success: true,
      members: result.rows
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei membri',
      error: error.message
    });
  }
});

export default router;
