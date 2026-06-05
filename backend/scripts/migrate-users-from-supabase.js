/**
 * FASE 2 — Script di migrazione one-time
 * Copia tutti gli utenti da Supabase Auth → tabella users locale (PostgreSQL VPS)
 * e invia loro un'email per impostare la nuova password.
 *
 * Uso:
 *   node backend/scripts/migrate-users-from-supabase.js             # live
 *   node backend/scripts/migrate-users-from-supabase.js --dry-run   # simula senza scrivere
 *   node backend/scripts/migrate-users-from-supabase.js --no-email  # migra senza inviare email
 *
 * Sicuro da eseguire più volte: gli utenti già migrati vengono saltati.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pg from 'pg';

// ── Config ───────────────────────────────────────────────────────────────────
const DRY_RUN      = process.argv.includes('--dry-run');
const SEND_EMAILS  = !process.argv.includes('--no-email');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://valutolab.com';
const RESET_EXPIRES_H = 72;
const EMAIL_DELAY_MS  = 300; // pausa tra email per non saturare Resend

// ── Connessioni ───────────────────────────────────────────────────────────────
const db = new pg.Pool({
  host:     process.env.DB_HOST     || 'valutolab2-postgres-1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'valutolab',
  user:     process.env.DB_USER     || 'valutolab',
  password: process.env.DB_PASSWORD
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createResetToken(userId) {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_EXPIRES_H * 3_600_000);
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3) ON CONFLICT (token_hash) DO NOTHING`,
    [userId, hashToken(token), expiresAt.toISOString()]
  );
  return token;
}

async function sendMigrationEmail(email, fullName, resetToken) {
  const link = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  await resend.emails.send({
    from: 'ValutoLab <noreply@valutolab.com>',
    to:   email,
    subject: 'Aggiorna le tue credenziali ValutoLab',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#4F46E5;margin:0 0 4px;">ValutoLab</h1>
        <h2>Ciao ${fullName || 'Utente'}!</h2>
        <p>
          Stiamo migliorando la sicurezza della piattaforma.<br>
          Per continuare ad accedere al tuo account devi impostare una nuova password.
        </p>
        <p>Il link è valido per <strong>${RESET_EXPIRES_H} ore</strong> e può essere usato una sola volta.</p>
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
        <p style="font-size:12px;color:#6B7280;">
          Se non hai un account ValutoLab, ignora questa email.
        </p>
      </div>`
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(  '║   Migrazione utenti Supabase → PostgreSQL VPS   ║');
  console.log(  '╚══════════════════════════════════════════════════╝');
  console.log(`  Modalità : ${DRY_RUN ? '🔍 DRY RUN (nessuna scrittura)' : '🚀 LIVE'}`);
  console.log(`  Email    : ${SEND_EMAILS ? '✉️  attive' : '🔇 disabilitate'}`);
  console.log(`  Reset URL: ${FRONTEND_URL}/reset-password?token=...\n`);

  // 1. Fetch utenti Supabase (paginazione automatica fino a 1000)
  const { data: { users: supaUsers }, error: supaError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (supaError) throw new Error(`Supabase listUsers: ${supaError.message}`);

  console.log(`📋 ${supaUsers.length} utenti trovati in Supabase Auth\n`);

  const stats = { migrated: 0, skipped: 0, errors: 0 };

  for (const su of supaUsers) {
    const email = su.email?.toLowerCase().trim();
    if (!email) {
      console.log(`  ⚠️  Skip (nessuna email): ${su.id}`);
      stats.skipped++;
      continue;
    }

    try {
      // Controlla se già presente in locale
      const { rows: existing } = await db.query(
        'SELECT id FROM users WHERE email = $1 OR supabase_id = $2',
        [email, su.id]
      );
      if (existing.length > 0) {
        console.log(`  ⏭️  Già migrato: ${email}`);
        stats.skipped++;
        continue;
      }

      // Legge profilo da user_profiles (full_name, is_admin, is_blocked)
      const { rows: profiles } = await db.query(
        'SELECT full_name, is_admin, is_blocked FROM user_profiles WHERE id = $1',
        [su.id]
      );
      const profile  = profiles[0];
      const fullName = profile?.full_name || su.user_metadata?.full_name || null;
      const role     = profile?.is_admin ? 'admin' : 'user';
      const isActive = !(profile?.is_blocked ?? false);

      if (DRY_RUN) {
        console.log(`  🔍 [DRY RUN] ${email} | role:${role} | name:${fullName} | active:${isActive}`);
        stats.migrated++;
        continue;
      }

      // Password hash casuale inutilizzabile — l'utente la imposterà via email
      const tempHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

      const { rows: inserted } = await db.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active, supabase_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [email, tempHash, fullName, role, isActive, su.id]
      );
      const newId = inserted[0].id;

      // Genera reset token e invia email
      const resetToken = await createResetToken(newId);

      if (SEND_EMAILS) {
        await sendMigrationEmail(email, fullName, resetToken);
        console.log(`  ✅ Migrato + email: ${email} (${role})`);
        await new Promise(r => setTimeout(r, EMAIL_DELAY_MS));
      } else {
        const link = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log(`  ✅ Migrato (no email): ${email} | link: ${link}`);
      }

      stats.migrated++;

    } catch (err) {
      console.error(`  ❌ Errore per ${email}:`, err.message);
      stats.errors++;
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`  ✅ Migrati  : ${stats.migrated}`);
  console.log(`  ⏭️  Saltati  : ${stats.skipped}`);
  console.log(`  ❌ Errori   : ${stats.errors}`);
  console.log('══════════════════════════════════════════════════\n');

  if (!DRY_RUN && stats.errors === 0) {
    console.log('🎉 Migrazione completata senza errori.');
  } else if (stats.errors > 0) {
    console.log('⚠️  Alcuni utenti non sono stati migrati. Controlla i log e ri-esegui lo script.');
  }

  await db.end();
}

migrate().catch(err => {
  console.error('\n❌ Migrazione fallita:', err.message);
  process.exit(1);
});
