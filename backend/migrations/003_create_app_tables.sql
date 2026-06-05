-- ============================================================
-- Migrazione completa: tutte le tabelle app nel VPS PostgreSQL
-- Eseguire UNA SOLA VOLTA. Sicuro da rieseguire (IF NOT EXISTS).
-- ============================================================

-- ── user_profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID        PRIMARY KEY,   -- uguale a users.supabase_id o users.id
  full_name   VARCHAR(255),
  is_admin    BOOLEAN     NOT NULL DEFAULT false,
  is_blocked  BOOLEAN     NOT NULL DEFAULT false,
  role        VARCHAR(50),
  industry    VARCHAR(100),
  seniority   VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── assessments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'in_progress',  -- in_progress | completed | abandoned
  total_score  NUMERIC(4,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id   ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status    ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- ── assessment_responses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_responses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL,
  question_id    VARCHAR(100) NOT NULL,
  answer_value   INTEGER     NOT NULL,
  skill_category VARCHAR(100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_ar_assessment_id ON assessment_responses(assessment_id);

-- ── assessment_results ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_results (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  skill_category VARCHAR(100) NOT NULL,
  score          NUMERIC(4,2) NOT NULL,
  percentile     NUMERIC(5,2),
  strengths      TEXT[],
  improvements   TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, skill_category)
);
CREATE INDEX IF NOT EXISTS idx_aresults_assessment_id ON assessment_results(assessment_id);

-- ── combined_assessment_results ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combined_assessment_results (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  skill_category VARCHAR(100) NOT NULL,
  likert_score   NUMERIC(4,2),
  sjt_score      NUMERIC(4,2),
  final_score    NUMERIC(4,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, skill_category)
);
CREATE INDEX IF NOT EXISTS idx_car_assessment_id ON combined_assessment_results(assessment_id);

-- ── qualitative_reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qualitative_reports (
  id                       UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id            UUID  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id                  UUID  NOT NULL,
  profile_insights         JSONB,
  category_interpretations JSONB,
  development_plan         JSONB,
  ai_model                 VARCHAR(100),
  generation_tokens        INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id)
);
CREATE INDEX IF NOT EXISTS idx_qr_assessment_id ON qualitative_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_qr_user_id       ON qualitative_reports(user_id);

-- ── situational_questions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS situational_questions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_skill  VARCHAR(100) NOT NULL,
  situation      TEXT        NOT NULL,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  options        JSONB       NOT NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sq_primary_skill ON situational_questions(primary_skill);

-- ── situational_responses ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS situational_responses (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id     UUID  NOT NULL,
  selected_option VARCHAR(10),
  skill_weights   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_sr_assessment_id ON situational_responses(assessment_id);

-- ── shared_profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL,
  share_token   VARCHAR(100) NOT NULL UNIQUE,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  view_count    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sp_assessment_id ON shared_profiles(assessment_id);
CREATE INDEX IF NOT EXISTS idx_sp_share_token   ON shared_profiles(share_token);
CREATE INDEX IF NOT EXISTS idx_sp_user_id       ON shared_profiles(user_id);

-- ── leadership_assessments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leadership_assessments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  total_score  NUMERIC(4,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_la_user_id ON leadership_assessments(user_id);

-- ── leadership_responses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leadership_responses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID        NOT NULL REFERENCES leadership_assessments(id) ON DELETE CASCADE,
  question_id    VARCHAR(100) NOT NULL,
  answer         VARCHAR(10),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_lr_assessment_id ON leadership_responses(assessment_id);

-- ── leadership_results ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leadership_results (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID        NOT NULL REFERENCES leadership_assessments(id) ON DELETE CASCADE,
  dimension      VARCHAR(100) NOT NULL,
  dimension_name VARCHAR(200),
  score          NUMERIC(4,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, dimension)
);
CREATE INDEX IF NOT EXISTS idx_lresults_assessment_id ON leadership_results(assessment_id);

-- ── leadership_ai_reports ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leadership_ai_reports (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID  NOT NULL REFERENCES leadership_assessments(id) ON DELETE CASCADE,
  user_id       UUID  NOT NULL,
  report_data   JSONB NOT NULL,
  ai_model      VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id)
);
CREATE INDEX IF NOT EXISTS idx_lar_assessment_id ON leadership_ai_reports(assessment_id);

-- ── assessment_questions (cache locale delle domande) ─────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text  TEXT         NOT NULL,
  category       VARCHAR(100) NOT NULL,
  question_order INTEGER      NOT NULL DEFAULT 0,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── email_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  subject   VARCHAR(500),
  status    VARCHAR(50)  NOT NULL DEFAULT 'sent',
  sent_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
