import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Consultation } from '@/types';
import {
  ArrowLeft, Building2, Clock, Activity,
  AlertTriangle, MessageSquare, TrendingUp,
  Stethoscope, ClipboardList,
} from 'lucide-react';

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
      .limit(100);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default async function HistoryPage() {
  const consultations = await getConsultations();

  const stats = {
    total: consultations.length,
    emergency: consultations.filter((c) => c.is_emergency).length,
    symptom: consultations.filter((c) => c.classification === 'symptom').length,
    inquiry: consultations.filter((c) => c.classification === 'inquiry').length,
  };

  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-slate-900 text-base">상담 기록</h1>
            <p className="text-xs text-slate-500">최근 100건의 상담 내역</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {consultations.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">아직 상담 기록이 없습니다</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">첫 번째 상담을 시작해 보세요</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Stethoscope size={16} />
              상담 시작하기
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={<ClipboardList size={18} className="text-blue-600" />}
                label="전체 상담"
                value={stats.total}
                color="border-blue-100"
              />
              <StatCard
                icon={<Activity size={18} className="text-emerald-600" />}
                label="증상 상담"
                value={stats.symptom}
                color="border-emerald-100"
              />
              <StatCard
                icon={<TrendingUp size={18} className="text-purple-600" />}
                label="진료 문의"
                value={stats.inquiry}
                color="border-purple-100"
              />
              <StatCard
                icon={<AlertTriangle size={18} className="text-red-500" />}
                label="응급 상황"
                value={stats.emergency}
                color="border-red-100"
              />
            </div>

            <p className="text-sm text-slate-500 font-medium mb-4">
              총 <span className="text-slate-900 font-bold">{stats.total}</span>건
            </p>

            <div className="space-y-4">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
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

                  <div className="mb-3">
                    <p className="text-xs text-slate-400 font-medium mb-1">환자 문의</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{c.patient_message}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-slate-400 font-medium mb-1">AI 안내</p>
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{c.ai_response}</p>
                  </div>

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

                  {(c.suspected_diseases as string[])?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(c.suspected_diseases as string[]).map((d, i) => (
                        <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
