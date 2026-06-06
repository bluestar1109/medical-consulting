-- 상담 기록 테이블 생성
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  patient_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'general'
    CHECK (classification IN ('symptom', 'inquiry', 'emergency', 'general')),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  suspected_diseases TEXT[] NOT NULL DEFAULT '{}',
  recommended_department TEXT NOT NULL DEFAULT '',
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_session   ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created   ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_class     ON consultations(classification);
CREATE INDEX IF NOT EXISTS idx_consultations_emergency ON consultations(is_emergency) WHERE is_emergency = TRUE;

-- Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON consultations;
CREATE POLICY "allow_all" ON consultations
  FOR ALL USING (true) WITH CHECK (true);
