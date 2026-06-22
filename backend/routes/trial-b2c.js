import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Resend } from 'resend';
import db from '../config/database.js';
import { benvenutoTrialB2C } from '../services/valutoLabEmails.js';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const BCRYPT_ROUNDS = 12;

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt.toISOString()]
  );
}

// Importa il generatore di access token da auth.js non è possibile (circular),
// quindi duplica la logica minima qui usando le stesse env vars
import jwt from 'jsonwebtoken';

function generateAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET non configurato');
  return jwt.sign(
    {
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      source:      user.source ?? 'trial',
      supabase_id: user.supabase_id ?? null
    },
    secret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '8h' }
  );
}

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
    // Controlla duplicato in users (sistema principale)
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Questa email è già registrata. Prova ad accedere.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, source)
       VALUES ($1, $2, $3, 'trial_user', 'trial')
       RETURNING id, email, full_name, role, source`,
      [email.toLowerCase().trim(), password_hash, full_name.trim()]
    );
    const user = rows[0];

    // Log in trial_users per analytics/quota
    try {
      await db.query(
        `INSERT INTO trial_users (user_id, full_name, email, assessment_quota, used_assessments, status, expires_at)
         VALUES ($1, $2, $3, 1, 0, 'active', NOW() + INTERVAL '30 days')
         ON CONFLICT DO NOTHING`,
        [user.id, full_name.trim(), email.toLowerCase().trim()]
      );
    } catch (trialErr) {
      // Non bloccante: se trial_users ha vincoli incompatibili, logga ma continua
      console.warn('trial_users insert skipped:', trialErr.message);
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    // Email di benvenuto con template grafico (senza password in chiaro)
    try {
      const mail = benvenutoTrialB2C({ full_name, email: email.toLowerCase().trim() });
      await resend.emails.send({
        from: 'ValutoLab <noreply@valutolab.com>',
        to: email.toLowerCase().trim(),
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr.message);
    }

    return res.status(201).json({
      success:       true,
      access_token:  accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, source: user.source }
    });

  } catch (err) {
    console.error('Trial B2C register error:', err);
    return res.status(500).json({ error: 'Errore interno. Riprova tra qualche minuto.' });
  }
});

export default router;
