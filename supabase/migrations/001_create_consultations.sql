-- 상담 기록 테이블
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  patient_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  classification TEXT CHECK (classification IN ('symptom', 'inquiry', 'emergency', 'general')),
  symptoms JSONB DEFAULT '[]'::jsonb,
  suspected_diseases JSONB DEFAULT '[]'::jsonb,
  recommended_department TEXT,
  is_emergency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_is_emergency ON consultations(is_emergency) WHERE is_emergency = TRUE;

-- RLS 활성화
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 삽입 허용 (서비스 레이어에서 접근)
CREATE POLICY "Allow insert" ON consultations FOR INSERT WITH CHECK (true);

-- 정책: 모든 조회 허용
CREATE POLICY "Allow select" ON consultations FOR SELECT USING (true);
