import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { ConsultationResponse } from '@/types';

function extractJson(text: string): ConsultationResponse | null {
  // 직접 파싱 시도
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parsed as ConsultationResponse;
  } catch {}

  // 마크다운 코드블록에서 JSON 추출
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      const parsed = JSON.parse(codeBlock[1].trim());
      if (parsed && typeof parsed === 'object') return parsed as ConsultationResponse;
    } catch {}
  }

  // 중괄호로 감싸진 JSON 추출
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed === 'object') return parsed as ConsultationResponse;
    } catch {}
  }

  return null;
}

const FALLBACK: ConsultationResponse = {
  message: '',
  classification: 'general',
  symptoms: [],
  suspected_diseases: [],
  recommended_department: '',
  is_emergency: false,
  emergency_message: null,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message, session_id, history } = body as {
      message?: string;
      session_id?: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해 주세요.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[chat] OPENROUTER_API_KEY not set');
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://medical-consulting-jade.vercel.app',
        'X-Title': '병원 환자 상담 봇',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(Array.isArray(history) ? history : []),
          { role: 'user', content: message.trim() },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!llmResponse.ok) {
      const err = await llmResponse.text();
      console.error('[chat] OpenRouter error', llmResponse.status, err.slice(0, 300));
      return NextResponse.json({ error: 'AI 서비스 호출에 실패했습니다.' }, { status: 502 });
    }

    const llmData = await llmResponse.json();
    const rawContent: string = llmData?.choices?.[0]?.message?.content ?? '';

    if (!rawContent) {
      console.error('[chat] Empty content from LLM:', JSON.stringify(llmData).slice(0, 300));
      return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    }

    const analysis = extractJson(rawContent);

    if (!analysis) {
      console.error('[chat] JSON parse failed. Raw:', rawContent.slice(0, 300));
      // JSON 파싱 실패 시 raw 텍스트를 메시지로 반환 (폴백)
      return NextResponse.json({ ...FALLBACK, message: rawContent });
    }

    // Supabase 저장 (실패해도 응답은 반환)
    try {
      const supabase = createClient();
      await supabase.from('consultations').insert({
        session_id: session_id || 'anonymous',
        patient_message: message.trim(),
        ai_response: analysis.message ?? '',
        classification: analysis.classification ?? 'general',
        symptoms: analysis.symptoms ?? [],
        suspected_diseases: analysis.suspected_diseases ?? [],
        recommended_department: analysis.recommended_department ?? '',
        is_emergency: analysis.is_emergency ?? false,
      });
    } catch (dbErr) {
      console.error('[chat] Supabase error:', String(dbErr).slice(0, 200));
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('[chat] Unexpected error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
