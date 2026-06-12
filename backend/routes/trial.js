import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import pg from 'pg';
import { confermaTrialB2B, attivazioneTrialB2B } from '../services/valutoLabEmails.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Le password non vengono più generate né inviate via email.
// Al loro posto si usa un link di attivazione monouso generato da Supabase.

router.post('/create', async (req, res) => {
  const { company_name, contact_name, contact_email, contact_phone, partita_iva, referent_role, notes } = req.body;

  if (!company_name || !contact_email) {
    return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  }

  try {
    const result = await db.query(
      `INSERT INTO trial_organizations 
       (company_name, contact_name, contact_email, contact_phone, partita_iva, referent_role, notes, status, assessment_quota)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 20)
       RETURNING *`,
      [company_name, contact_name, contact_email, contact_phone, partita_iva, referent_role, notes]
    );

    const trial = result.rows[0];

    const mailConferma = confermaTrialB2B({ contact_name, company_name });
    await resend.emails.send({
      from: 'ValutoLab <info@valutolab.com>',
      to: contact_email,
      subject: mailConferma.subject,
      html: mailConferma.html,
      text: mailConferma.text
    });

    return res.status(201).json({ success: true, trial });

  } catch (error) {
    console.error('Trial create error:', error);
    return res.status(500).json({ error: 'Errore creazione trial: ' + error.message });
  }
});

router.post('/activate/:id', async (req, res) => {
  const { id } = req.params;
  const { assessment_quota, days } = req.body;

  try {
    const trialResult = await db.query('SELECT * FROM trial_organizations WHERE id = $1', [id]);
    if (trialResult.rows.length === 0) return res.status(404).json({ error: 'Trial non trovato' });

    const trial = trialResult.rows[0];
    if (trial.status === 'active') return res.status(400).json({ error: 'Trial già attivo' });

    const quota = assessment_quota || trial.assessment_quota || 20;
    const expiresAt = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);

    let userId;

    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = existingUsers?.users?.find(u => u.email === trial.contact_email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Crea utente senza password: l'accesso avviene solo tramite link monouso
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: trial.contact_email,
        email_confirm: true,
        user_metadata: {
          full_name: trial.contact_name,
          company: trial.company_name,
          is_trial: true,
          trial_id: id
        }
      });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Genera link di attivazione monouso (valido 72h) — nessuna password in chiaro
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://valutolab.com';
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: trial.contact_email,
      options: { redirectTo: `${FRONTEND_URL}/dashboard` }
    });
    if (linkError) throw linkError;
    const activationLink = linkData.properties.action_link;

    await db.query(
      `UPDATE trial_organizations 
       SET status = 'active', user_id = $1, assessment_quota = $2, expires_at = $3, activated_at = NOW()
       WHERE id = $4`,
      [userId, quota, expiresAt.toISOString(), id]
    );

    await db.query(
      `INSERT INTO organizations (name, contact_email, user_id, subscription_tier, subscription_status, assessment_quota, used_assessments)
       VALUES ($1, $2, $3, 'trial', 'trial', $4, 0)
       ON CONFLICT (contact_email) DO UPDATE SET user_id = $3, assessment_quota = $4`,
      [trial.company_name, trial.contact_email, userId, quota]
    );

    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       SELECT id, $1, 'owner' FROM organizations WHERE contact_email = $2
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [userId, trial.contact_email]
    );

    const mailAttivazione = attivazioneTrialB2B({
      contact_name: trial.contact_name,
      company_name: trial.company_name,
      quota,
      expiresAt: expiresAt.toLocaleDateString('it-IT'),
      activationLink
    });
    await resend.emails.send({
      from: 'ValutoLab <info@valutolab.com>',
      to: trial.contact_email,
      subject: mailAttivazione.subject,
      html: mailAttivazione.html,
      text: mailAttivazione.text
    });

    return res.status(200).json({
      success: true,
      message: 'Trial attivato! Email con credenziali inviata.'
    });

  } catch (error) {
    console.error('Trial activation error:', error);
    return res.status(500).json({ error: 'Errore attivazione: ' + error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM trial_organizations ORDER BY created_at DESC');
    return res.status(200).json({ success: true, trials: result.rows });
  } catch (error) {
    console.error('Trial list error:', error);
    return res.status(500).json({ error: 'Errore recupero trial' });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { assessment_quota, add_days, notes, status } = req.body;

  try {
    let query = 'UPDATE trial_organizations SET ';
    const updates = [];
    const values = [];
    let idx = 1;

    if (assessment_quota) { updates.push(`assessment_quota = $${idx++}`); values.push(assessment_quota); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes); }
    if (status) { updates.push(`status = $${idx++}`); values.push(status); }

    if (add_days) {
      const trialResult = await db.query('SELECT expires_at FROM trial_organizations WHERE id = $1', [id]);
      const currentExpiry = new Date(trialResult.rows[0].expires_at);
      currentExpiry.setDate(currentExpiry.getDate() + add_days);
      updates.push(`expires_at = $${idx++}`);
      values.push(currentExpiry.toISOString());
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

    values.push(id);
    query += updates.join(', ') + ` WHERE id = $${idx} RETURNING *`;

    const result = await db.query(query, values);
    return res.status(200).json({ success: true, trial: result.rows[0] });

  } catch (error) {
    console.error('Trial update error:', error);
    return res.status(500).json({ error: 'Errore aggiornamento trial' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const trialResult = await db.query('SELECT user_id FROM trial_organizations WHERE id = $1', [id]);
    if (trialResult.rows.length === 0) return res.status(404).json({ error: 'Trial non trovato' });

    const userId = trialResult.rows[0].user_id;

    await db.query('DELETE FROM trial_organizations WHERE id = $1', [id]);

    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }

    return res.status(200).json({ success: true, message: 'Trial eliminato' });

  } catch (error) {
    console.error('Trial delete error:', error);
    return res.status(500).json({ error: 'Errore eliminazione trial' });
  }
});

export default router;
