import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import pg from 'pg';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Genera password sicura
function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// POST /api/v1/trial/create
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

    await resend.emails.send({
      from: 'ValutoLab <info@valutolab.com>',
      to: contact_email,
      subject: '✅ Richiesta Trial ValutoLab Ricevuta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ciao ${contact_name}! 👋</h2>
          <p>Abbiamo ricevuto la tua richiesta di trial per <strong>${company_name}</strong>.</p>
          <p>Il nostro team la esaminerà a breve e riceverai le credenziali di accesso via email.</p>
          <p>Il Team ValutoLab</p>
        </div>
      `
    });

    return res.status(201).json({ success: true, trial });

  } catch (error) {
    console.error('Trial create error:', error);
    return res.status(500).json({ error: 'Errore creazione trial: ' + error.message });
  }
});

// POST /api/v1/trial/activate/:id
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

    // Genera password
    const password = generatePassword();

    let userId;

    // Controlla se utente esiste già in Supabase
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = existingUsers?.users?.find(u => u.email === trial.contact_email);

    if (existingUser) {
      // Utente esiste: aggiorna la password
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) throw updateError;
    } else {
      // Crea nuovo utente con password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: trial.contact_email,
        password,
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

    // Aggiorna trial nel database
    await db.query(
      `UPDATE trial_organizations 
       SET status = 'active', user_id = $1, assessment_quota = $2, expires_at = $3, activated_at = NOW()
       WHERE id = $4`,
      [userId, quota, expiresAt.toISOString(), id]
    );

    // Invia email con credenziali
    await resend.emails.send({
      from: 'ValutoLab <info@valutolab.com>',
      to: trial.contact_email,
      subject: '🎉 Il tuo Trial ValutoLab è Attivo - Credenziali di Accesso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5;">ValutoLab</h1>
          </div>
          
          <h2>Ciao ${trial.contact_name}! 🎉</h2>
          <p>Il tuo trial per <strong>${trial.company_name}</strong> è attivo!</p>
          
          <div style="background: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">📋 Riepilogo Trial</h3>
            <p>✅ <strong>${quota} assessment</strong> disponibili</p>
            <p>✅ Valido fino al <strong>${expiresAt.toLocaleDateString('it-IT')}</strong></p>
          </div>

          <div style="background: #EEF2FF; border: 2px solid #4F46E5; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #4F46E5;">🔑 Le tue credenziali di accesso</h3>
            <p><strong>URL:</strong> <a href="https://valutolab.com/login">valutolab.com/login</a></p>
            <p><strong>Email:</strong> ${trial.contact_email}</p>
            <p><strong>Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
            <p style="color: #6B7280; font-size: 14px;">💡 Ti consigliamo di cambiare la password dopo il primo accesso.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://valutolab.com/login" 
               style="background: #4F46E5; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold;">
              Accedi alla Piattaforma →
            </a>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            Hai bisogno di aiuto? Scrivici a <a href="mailto:info@valutolab.com">info@valutolab.com</a>
          </p>
          <p>Il Team ValutoLab</p>
        </div>
      `
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

// GET /api/v1/trial/list
router.get('/list', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM trial_organizations ORDER BY created_at DESC');
    return res.status(200).json({ success: true, trials: result.rows });
  } catch (error) {
    console.error('Trial list error:', error);
    return res.status(500).json({ error: 'Errore recupero trial' });
  }
});

// PUT /api/v1/trial/update/:id
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

// DELETE /api/v1/trial/delete/:id
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Recupera user_id prima di eliminare
    const trialResult = await db.query('SELECT user_id FROM trial_organizations WHERE id = $1', [id]);
    if (trialResult.rows.length === 0) return res.status(404).json({ error: 'Trial non trovato' });

    const userId = trialResult.rows[0].user_id;

    // Elimina trial dal DB
    await db.query('DELETE FROM trial_organizations WHERE id = $1', [id]);

    // Elimina utente da Supabase se esiste
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
