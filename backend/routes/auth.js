import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database.js';

const router = express.Router();

// ── Costanti ────────────────────────────────────────────────────────────────
const ACCESS_SECRET        = process.env.JWT_SECRET;
const REFRESH_SECRET       = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES       = process.env.JWT_ACCESS_EXPIRES   || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);
const BCRYPT_ROUNDS        = 12;

// ── Helper ──────────────────────────────────────────────────────────────────
function generateAccessToken(user) {
  if (!ACCESS_SECRET) throw new Error('JWT_SECRET non configurato');
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86_400_000);
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
      `SELECT id, email, password_hash, full_name, role, is_active
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
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
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
      decoded = jwt.verify(authHeader.slice(7), ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token scaduto' : 'Token non valido'
      });
    }

    const { rows } = await db.query(
      `SELECT id, email, full_name, role, created_at, last_login
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

export default router;
