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

// POST /api/trial-b2c/register
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri.' });
  }

  try {
    // 1. Controlla se email già registrata in trial_users
    const existing = await db.query(
      'SELECT id FROM trial_users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Questa email è già registrata. Prova ad accedere.' });
    }

    // 2. Crea utente su Supabase Auth
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
        return res.status(409).json({ error: 'Questa email è già registrata. Prova ad accedere.' });
      }
      return res.status(500).json({ error: "Errore durante la creazione dell'account." });
    }

    const userId = authData.user.id;

    // 3. Salva in trial_users su VPS PostgreSQL
    await db.query(
      `INSERT INTO trial_users 
        (user_id, full_name, email, assessment_quota, used_assessments, status, expires_at)
       VALUES ($1, $2, $3, 1, 0, 'active', NOW() + INTERVAL '30 days')`,
      [userId, full_name, email]
    );

    // 4. Invia email con credenziali
    await resend.emails.send({
      from: 'ValutoLab <noreply@valutolab.com>',
      to: email,
      subject: '🎉 Il tuo account ValutoLab è pronto!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">ValutoLab</h1>
            <p style="color: #6b7280; margin: 5px 0;">Valutazione Soft Skills Professionale</p>
          </div>
          <h2 style="color: #1f2937;">Ciao ${full_name}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Il tuo account trial è stato creato con successo. Hai a disposizione 
            <strong>1 assessment gratuito</strong> valido per 30 giorni.
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Le tue credenziali di accesso:</p>
            <p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 4px 0; color: #1f2937;"><strong>Password:</strong> ${password}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://valutolab.com/login" 
               style="background: #7c3aed; color: white; padding: 14px 32px; 
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Inizia il tuo Assessment →
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">
            L'assessment dura circa <strong>10-15 minuti</strong> e valuta 12 soft skills professionali.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Hai domande? Scrivici a <a href="mailto:info@valutolab.com" style="color: #7c3aed;">info@valutolab.com</a>
          </p>
        </div>
      `
    });

    return res.status(201).json({
      success: true,
      message: 'Account creato con successo! Controlla la tua email per le credenziali di accesso.'
    });

  } catch (err) {
    console.error('Trial B2C register error:', err);
    return res.status(500).json({ error: 'Errore interno del server. Riprova tra qualche minuto.' });
  }
});

export default router;
