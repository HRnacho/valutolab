/**
 * Script di migrazione one-time: copia tutti i dati da Supabase → VPS PostgreSQL
 *
 * Uso:
 *   node backend/scripts/migrate-supabase-data.js             # migra tutto
 *   node backend/scripts/migrate-supabase-data.js --dry-run   # simula senza scrivere
 *   node backend/scripts/migrate-supabase-data.js --table=assessments  # solo una tabella
 *
 * Pre-requisiti:
 *   - Aver eseguito migrations/003_create_app_tables.sql sul VPS
 *   - .env con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DB_PASSWORD, ecc.
 *
 * Lo script è idempotente: usa INSERT ... ON CONFLICT DO NOTHING
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const DRY_RUN     = process.argv.includes('--dry-run');
const TABLE_ONLY  = process.argv.find(a => a.startsWith('--table='))?.split('=')[1];
const BATCH_SIZE  = 200;

// ── Connessioni ──────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const db = new pg.Pool({
  host:     process.env.DB_HOST     || 'valutolab2-postgres-1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'valutolab',
  user:     process.env.DB_USER     || 'valutolab',
  password: process.env.DB_PASSWORD
});

// ── Helper ───────────────────────────────────────────────────────────────────

function log(msg) { console.log(`  ${msg}`); }

async function fetchAll(table, columns = '*') {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + BATCH_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error) { log(`❌ Supabase error on ${table}: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }
  return all;
}

// ── Tabelle da migrare ────────────────────────────────────────────────────────

const migrations = [

  {
    name: 'user_profiles',
    migrate: async () => {
      const rows = await fetchAll('user_profiles', 'id,full_name,is_admin,is_blocked,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO user_profiles (id, full_name, is_admin, is_blocked, created_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.full_name, r.is_admin ?? false, r.is_blocked ?? false, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'assessments',
    migrate: async () => {
      const rows = await fetchAll('assessments', 'id,user_id,status,total_score,created_at,completed_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO assessments (id, user_id, status, total_score, created_at, completed_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.user_id, r.status, r.total_score, r.created_at, r.completed_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'assessment_responses',
    migrate: async () => {
      const rows = await fetchAll('assessment_responses', 'id,assessment_id,user_id,question_id,answer_value,skill_category,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO assessment_responses (id, assessment_id, user_id, question_id, answer_value, skill_category, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (assessment_id, question_id) DO NOTHING`,
          [r.id, r.assessment_id, r.user_id, r.question_id, r.answer_value, r.skill_category, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'assessment_results',
    migrate: async () => {
      const rows = await fetchAll('assessment_results', 'id,assessment_id,skill_category,score,percentile,strengths,improvements,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO assessment_results (id, assessment_id, skill_category, score, percentile, strengths, improvements, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (assessment_id, skill_category) DO NOTHING`,
          [r.id, r.assessment_id, r.skill_category, r.score, r.percentile, r.strengths, r.improvements, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'combined_assessment_results',
    migrate: async () => {
      const rows = await fetchAll('combined_assessment_results', 'id,assessment_id,skill_category,likert_score,sjt_score,final_score,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO combined_assessment_results (id, assessment_id, skill_category, likert_score, sjt_score, final_score, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (assessment_id, skill_category) DO NOTHING`,
          [r.id, r.assessment_id, r.skill_category, r.likert_score, r.sjt_score, r.final_score, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'qualitative_reports',
    migrate: async () => {
      const rows = await fetchAll('qualitative_reports', 'id,assessment_id,user_id,profile_insights,category_interpretations,development_plan,ai_model,generation_tokens,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO qualitative_reports (id, assessment_id, user_id, profile_insights, category_interpretations, development_plan, ai_model, generation_tokens, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (assessment_id) DO NOTHING`,
          [r.id, r.assessment_id, r.user_id,
           JSON.stringify(r.profile_insights), JSON.stringify(r.category_interpretations),
           JSON.stringify(r.development_plan), r.ai_model, r.generation_tokens, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'situational_questions',
    migrate: async () => {
      const rows = await fetchAll('situational_questions', 'id,primary_skill,situation,display_order,options,is_active,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO situational_questions (id, primary_skill, situation, display_order, options, is_active, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.primary_skill, r.situation, r.display_order, JSON.stringify(r.options), r.is_active ?? true, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'situational_responses',
    migrate: async () => {
      const rows = await fetchAll('situational_responses', 'id,assessment_id,question_id,selected_option,skill_weights,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO situational_responses (id, assessment_id, question_id, selected_option, skill_weights, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (assessment_id, question_id) DO NOTHING`,
          [r.id, r.assessment_id, r.question_id, r.selected_option, JSON.stringify(r.skill_weights), r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'shared_profiles',
    migrate: async () => {
      const rows = await fetchAll('shared_profiles', 'id,assessment_id,user_id,share_token,is_active,view_count,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO shared_profiles (id, assessment_id, user_id, share_token, is_active, view_count, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (share_token) DO NOTHING`,
          [r.id, r.assessment_id, r.user_id, r.share_token, r.is_active ?? true, r.view_count ?? 0, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'leadership_assessments',
    migrate: async () => {
      const rows = await fetchAll('leadership_assessments', 'id,user_id,status,total_score,created_at,completed_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO leadership_assessments (id, user_id, status, total_score, created_at, completed_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.user_id, r.status, r.total_score, r.created_at, r.completed_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'leadership_responses',
    migrate: async () => {
      const rows = await fetchAll('leadership_responses', 'id,assessment_id,question_id,answer,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO leadership_responses (id, assessment_id, question_id, answer, created_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (assessment_id, question_id) DO NOTHING`,
          [r.id, r.assessment_id, r.question_id, r.answer, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'leadership_results',
    migrate: async () => {
      const rows = await fetchAll('leadership_results', 'id,assessment_id,dimension,dimension_name,score,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO leadership_results (id, assessment_id, dimension, dimension_name, score, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (assessment_id, dimension) DO NOTHING`,
          [r.id, r.assessment_id, r.dimension, r.dimension_name, r.score, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  },

  {
    name: 'leadership_ai_reports',
    migrate: async () => {
      const rows = await fetchAll('leadership_ai_reports', 'id,assessment_id,user_id,report_data,ai_model,created_at');
      log(`📋 ${rows.length} righe trovate`);
      if (DRY_RUN) return rows.length;
      let count = 0;
      for (const r of rows) {
        const { rowCount } = await db.query(
          `INSERT INTO leadership_ai_reports (id, assessment_id, user_id, report_data, ai_model, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (assessment_id) DO NOTHING`,
          [r.id, r.assessment_id, r.user_id, JSON.stringify(r.report_data), r.ai_model, r.created_at]
        );
        count += rowCount;
      }
      return count;
    }
  }

];

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(  '║   Migrazione dati Supabase → VPS PostgreSQL     ║');
  console.log(  '╚══════════════════════════════════════════════════╝');
  console.log(`  Modalità : ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
  if (TABLE_ONLY) console.log(`  Tabella  : ${TABLE_ONLY} (solo questa)`);
  console.log('');

  const toRun = TABLE_ONLY
    ? migrations.filter(m => m.name === TABLE_ONLY)
    : migrations;

  if (TABLE_ONLY && toRun.length === 0) {
    console.error(`❌ Tabella "${TABLE_ONLY}" non trovata`);
    process.exit(1);
  }

  let totalInserted = 0;
  for (const m of toRun) {
    process.stdout.write(`\n▶ ${m.name} ... `);
    try {
      const inserted = await m.migrate();
      console.log(`✅ ${inserted} righe ${DRY_RUN ? 'trovate' : 'inserite'}`);
      totalInserted += inserted;
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`  Totale: ${totalInserted} righe ${DRY_RUN ? 'trovate in Supabase' : 'inserite nel VPS'}`);
  console.log('══════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('ℹ️  DRY RUN completato. Esegui senza --dry-run per la migrazione reale.');
  } else {
    console.log('🎉 Migrazione completata. Verifica i dati prima di rimuovere Supabase.');
  }

  await db.end();
}

run().catch(err => {
  console.error('❌ Migrazione fallita:', err.message);
  process.exit(1);
});
