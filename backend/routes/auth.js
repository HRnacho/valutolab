import 'dotenv/config';   // carica .env prima di leggere process.env
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import db from '../config/database.js';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

// ── Costanti ────────────────────────────────────────────────────────────────
// Lette tramite getter lazy: se dotenv viene caricato dopo il modulo
// (tipico con ESM import-hoisting), i valori sono comunque corretti
// al momento della prima chiamata a una route.
const getAccessSecret  = () => process.env.JWT_SECRET;
const ACCESS_EXPIRES       = () => process.env.JWT_ACCESS_EXPIRES   || '15m';
const REFRESH_EXPIRES_DAYS = () => parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);
const BCRYPT_ROUNDS        = 12;

// ── Helper ──────────────────────────────────────────────────────────────────
function generateAccessToken(user) {
  const secret = getAccessSecret();
  if (!secret) throw new Error('JWT_SECRET non configurato nel file .env');
  return jwt.sign(
    {
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      // supabase_id permette al frontend di continuare a usare lo stesso
      // UUID per le query sui dati Supabase già esistenti
      supabase_id: user.supabase_id ?? null
    },
    secret,
    { expiresIn: ACCESS_EXPIRES() }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS() * 86_400_000);
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt.toISOString()]
  );
}

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email e password sono obbligatori' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La password deve essere di almeno 8 caratteri' });
    }

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email già registrata' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, full_name, role`,
      [email.toLowerCase().trim(), password_hash, full_name?.trim() || null]
    );
    const user = rows[0];

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    return res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_token:  accessToken,
      refresh_token: refreshToken,
      expires_in:    ACCESS_EXPIRES
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email e password sono obbligatori' });
    }

    const { rows } = await db.query(
      `SELECT id, email, password_hash, full_name, role, is_active, supabase_id
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = rows[0];

    // Risposta generica per non rivelare se l'email esiste
    const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !validPassword) {
      return res.status(401).json({ success: false, message: 'Credenziali non valide' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account disabilitato. Contatta il supporto.' });
    }

    // Aggiorna last_login in background (non bloccare la risposta)
    db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]).catch(() => {});

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    return res.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, supabase_id: user.supabase_id ?? null },
      access_token:  accessToken,
      refresh_token: refreshToken,
      expires_in:    ACCESS_EXPIRES
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'refresh_token mancante' });
    }

    const tokenHash = hashToken(refresh_token);
    const { rows } = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
              u.email, u.role, u.full_name, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );
    const record = rows[0];

    if (!record)             return res.status(401).json({ success: false, message: 'Token non valido' });
    if (record.revoked_at)   return res.status(401).json({ success: false, message: 'Token già revocato' });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: 'Token scaduto' });
    }
    if (!record.is_active)   return res.status(403).json({ success: false, message: 'Account disabilitato' });

    // Rotation: revoca il vecchio, emette il nuovo
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [record.id]);

    const user         = { id: record.user_id, email: record.email, role: record.role };
    const newAccess    = generateAccessToken(user);
    const newRefresh   = generateRefreshToken();
    await saveRefreshToken(record.user_id, newRefresh);

    return res.json({
      success:       true,
      access_token:  newAccess,
      refresh_token: newRefresh,
      expires_in:    ACCESS_EXPIRES
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await db.query(
        `UPDATE refresh_tokens
         SET revoked_at = NOW()
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [hashToken(refresh_token)]
      );
    }
    return res.json({ success: true, message: 'Logout effettuato' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token mancante' });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.slice(7), getAccessSecret());
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token scaduto' : 'Token non valido'
      });
    }

    const { rows } = await db.query(
      `SELECT id, email, full_name, role, created_at, last_login, supabase_id
       FROM users WHERE id = $1 AND is_active = true`,
      [decoded.sub]
    );
    if (!rows[0]) {
      return res.status(401).json({ success: false, message: 'Utente non trovato' });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── Helper reset password ───────────────────────────────────────────────────
const RESET_TOKEN_EXPIRES_H = 24;

async function createResetToken(userId) {
  const token    = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_H * 3_600_000);

  // Revoca eventuali token precedenti non ancora usati
  await db.query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt.toISOString()]
  );
  return token;
}

async function sendResetEmail({ to, fullName, resetToken, subject, intro }) {
  const link = `${process.env.FRONTEND_URL || 'https://valutolab.com'}/reset-password?token=${resetToken}`;
  await getResend().emails.send({
    from: 'ValutoLab <noreply@valutolab.com>',
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#4F46E5;margin:0 0 4px;">ValutoLab</h1>
        <h2 style="margin:0 0 16px;">Ciao ${fullName || 'Utente'}!</h2>
        <p>${intro}</p>
        <p>Il link è valido per <strong>${RESET_TOKEN_EXPIRES_H} ore</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${link}"
             style="background:#4F46E5;color:white;padding:14px 32px;border-radius:8px;
                    text-decoration:none;font-size:16px;font-weight:bold;">
            Imposta nuova password
          </a>
        </div>
        <p style="font-size:12px;color:#6B7280;">
          Se il pulsante non funziona, copia questo link nel browser:<br>
          <span style="word-break:break-all;">${link}</span>
        </p>
      </div>`
  });
}

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email obbligatoria' });
    }

    const { rows } = await db.query(
      'SELECT id, full_name FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    // Risposta sempre positiva: non rivela se l'email è registrata
    if (rows[0]) {
      const token = await createResetToken(rows[0].id);
      await sendResetEmail({
        to: email.toLowerCase().trim(),
        fullName: rows[0].full_name,
        resetToken: token,
        subject: 'Reimposta la tua password — ValutoLab',
        intro: 'Hai richiesto di reimpostare la password del tuo account ValutoLab.'
      });
    }

    return res.json({
      success: true,
      message: "Se l'email è registrata, riceverai le istruzioni entro pochi minuti."
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token e password sono obbligatori' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La password deve essere di almeno 8 caratteri' });
    }

    const { rows } = await db.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at,
              u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1`,
      [hashToken(token)]
    );
    const record = rows[0];

    if (!record)         return res.status(400).json({ success: false, message: 'Token non valido' });
    if (record.used_at)  return res.status(400).json({ success: false, message: 'Token già utilizzato' });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Token scaduto. Richiedi un nuovo link.' });
    }
    if (!record.is_active) {
      return res.status(403).json({ success: false, message: 'Account disabilitato' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2',     [password_hash, record.user_id]);
    await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [record.id]);

    return res.json({ success: true, message: 'Password aggiornata. Puoi ora effettuare il login.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/google ────────────────────────────────────────────────────
// Avvia il flusso OAuth 2.0 Google (redirect a Google)
router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'Google OAuth non configurato' });
  }
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  `${process.env.BACKEND_URL || 'https://api.valutolab.com'}/api/auth/google/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/auth/google/callback ───────────────────────────────────────────
// Google redirige qui con il codice di autorizzazione
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://valutolab.com';
  const { code, error: oauthError } = req.query;

  if (oauthError || !code) {
    return res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
  }

  try {
    // 1. Scambia il codice con i token Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code:          code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${process.env.BACKEND_URL || 'https://api.valutolab.com'}/api/auth/google/callback`,
        grant_type:    'authorization_code'
      })
    });
    const googleTokens = await tokenRes.json();
    if (!googleTokens.access_token) throw new Error('Token Google non ricevuto');

    // 2. Recupera info utente da Google
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` }
    });
    const googleUser = await infoRes.json();
    if (!googleUser.email) throw new Error('Email Google non ricevuta');

    const email = googleUser.email.toLowerCase().trim();

    // 3. Trova o crea utente nel DB locale
    let { rows } = await db.query(
      'SELECT id, email, full_name, role, supabase_id FROM users WHERE email = $1',
      [email]
    );

    let user = rows[0];
    if (!user) {
      const tempHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const result  = await db.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, 'user', true)
         RETURNING id, email, full_name, role, supabase_id`,
        [email, tempHash, googleUser.name || email]
      );
      user = result.rows[0];
    }

    // 4. Emette JWT custom
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    // 5. Redirige al frontend con i token in query string
    const params = new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken });
    res.redirect(`${frontendUrl}/auth/callback?${params}`);

  } catch (err: any) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

export default router;
