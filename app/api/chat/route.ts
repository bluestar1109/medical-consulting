import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { ConsultationResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, history } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해 주세요.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': '병원 환자 상담 봇',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(history || []),
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
    });

    if (!llmResponse.ok) {
      const err = await llmResponse.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'AI 서비스 호출 실패' }, { status: 502 });
    }

    const llmData = await llmResponse.json();
    const rawContent = llmData.choices?.[0]?.message?.content;

    let analysis: ConsultationResponse;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    // Save to Supabase (non-blocking)
    try {
      const supabase = createClient();
      await supabase.from('consultations').insert({
        session_id: session_id || 'anonymous',
        patient_message: message,
        ai_response: analysis.message,
        classification: analysis.classification,
        symptoms: analysis.symptoms ?? [],
        suspected_diseases: analysis.suspected_diseases ?? [],
        recommended_department: analysis.recommended_department ?? '',
        is_emergency: analysis.is_emergency ?? false,
      });
    } catch (dbErr) {
      console.error('Supabase insert error:', dbErr);
      // DB 오류가 있어도 AI 응답은 반환
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
