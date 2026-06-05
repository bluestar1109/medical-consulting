import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Consultation } from '@/types';
import { ArrowLeft, Building2, Clock, Activity, AlertTriangle, MessageSquare } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  symptom: '증상 상담',
  inquiry: '진료 문의',
  emergency: '응급 상황',
  general: '일반 대화',
};

const CLASS_COLORS: Record<string, string> = {
  symptom: 'bg-blue-100 text-blue-800',
  inquiry: 'bg-purple-100 text-purple-800',
  emergency: 'bg-red-100 text-red-800',
  general: 'bg-slate-100 text-slate-700',
};

async function getConsultations(): Promise<Consultation[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function HistoryPage() {
  const consultations = await getConsultations();

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-slate-900 text-base">상담 기록</h1>
            <p className="text-xs text-slate-500">최근 50건의 상담 내역</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {consultations.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">아직 상담 기록이 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">첫 번째 상담을 시작해 보세요</p>
            <Link
              href="/"
              className="mt-4 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              상담 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">총 {consultations.length}건</p>
            {consultations.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CLASS_COLORS[c.classification] ?? 'bg-slate-100 text-slate-700'}`}>
                      {CLASS_LABELS[c.classification] ?? c.classification}
                    </span>
                    {c.is_emergency && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <AlertTriangle size={11} />
                        응급
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <Clock size={12} />
                    {formatDate(c.created_at)}
                  </div>
                </div>

                {/* Patient message */}
                <div className="mb-3">
                  <p className="text-xs text-slate-400 font-medium mb-1">환자 문의</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{c.patient_message}</p>
                </div>

                {/* AI response */}
                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-slate-400 font-medium mb-1">AI 안내</p>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{c.ai_response}</p>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {c.recommended_department && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-blue-500" />
                      {c.recommended_department}
                    </span>
                  )}
                  {(c.symptoms as string[])?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Activity size={12} className="text-emerald-500" />
                      {(c.symptoms as string[]).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
