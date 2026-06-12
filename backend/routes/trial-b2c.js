import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import pg from 'pg';
import { benvenutoTrialB2C } from '../services/valutoLabEmails.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri.' });
  }

  try {
    const existing = await db.query(
      'SELECT id FROM trial_users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Questa email e già registrata. Prova ad accedere.' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'trial_user'
      }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return res.status(409).json({ error: 'Questa email e già registrata. Prova ad accedere.' });
      }
      return res.status(500).json({ error: 'Errore durante la creazione account.' });
    }

    const userId = authData.user.id;

    await db.query(
      `INSERT INTO trial_users 
        (user_id, full_name, email, assessment_quota, used_assessments, status, expires_at)
       VALUES ($1, $2, $3, 1, 0, 'active', NOW() + INTERVAL '30 days')`,
      [userId, full_name, email]
    );

    const mailBenvenuto = benvenutoTrialB2C({ full_name, email, password });
    await resend.emails.send({
      from: 'ValutoLab <noreply@valutolab.com>',
      to: email,
      subject: mailBenvenuto.subject,
      html: mailBenvenuto.html,
      text: mailBenvenuto.text
    });

    return res.status(201).json({
      success: true,
      message: 'Account creato! Controlla la tua email per le credenziali.'
    });

  } catch (err) {
    console.error('Trial B2C register error:', err);
    return res.status(500).json({ error: 'Errore interno. Riprova tra qualche minuto.' });
  }
});

export default router;
