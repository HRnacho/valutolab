-- Migration 003: profiling questions support
-- Run via: psql $DATABASE_URL -f migrations/003_profiling_and_context.sql

-- 1. Colonna answer_text in assessment_responses (per domande profiling testuali)
ALTER TABLE assessment_responses
  ADD COLUMN IF NOT EXISTS answer_text TEXT;

-- 2. user_context JSONB in assessments (aggregato delle risposte di profilazione)
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS user_context JSONB;

-- 3. hr_notes JSONB in qualitative_reports (visibile solo HR, mai esposto al candidato)
ALTER TABLE qualitative_reports
  ADD COLUMN IF NOT EXISTS hr_notes JSONB;
