import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { ConsultationResponse } from '@/types';

function extractJson(text: string): ConsultationResponse | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parsed as ConsultationResponse;
  } catch {}

  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      const parsed = JSON.parse(codeBlock[1].trim());
      if (parsed && typeof parsed === 'object') return parsed as ConsultationResponse;
    } catch {}
  }

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
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://medical-consulting-jade.vercel.app';

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': appUrl,
        'X-Title': 'Hospital Patient Consulting Bot',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(Array.isArray(history) ? history.slice(-8) : []),
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
      return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    }

    const analysis = extractJson(rawContent);

    if (!analysis) {
      return NextResponse.json({ ...FALLBACK, message: rawContent });
    }

    saveToSupabase({
      session_id: session_id || 'anonymous',
      patient_message: message.trim(),
      ai_response: analysis.message ?? '',
      classification: analysis.classification ?? 'general',
      symptoms: analysis.symptoms ?? [],
      suspected_diseases: analysis.suspected_diseases ?? [],
      recommended_department: analysis.recommended_department ?? '',
      is_emergency: analysis.is_emergency ?? false,
    });

    return NextResponse.json(analysis);
  } catch (err) {
    const e = err as Error;
    console.error('[chat] Unexpected error:', e?.name, e?.message);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function saveToSupabase(record: {
  session_id: string;
  patient_message: string;
  ai_response: string;
  classification: string;
  symptoms: string[];
  suspected_diseases: string[];
  recommended_department: string;
  is_emergency: boolean;
}) {
  try {
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const { error } = await supabase.from('consultations').insert(record);
    if (error) console.error('[supabase] insert error:', error.message);
  } catch (dbErr) {
    console.error('[supabase] client error:', String(dbErr).slice(0, 200));
  }
}
