'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import {
  Send, AlertTriangle, Stethoscope, Building2,
  History, Activity, Loader2, Phone, Clock,
  Heart, ChevronRight, Thermometer, Brain,
  Pill, Search,
} from 'lucide-react';
import { ChatMessage, ConsultationResponse } from '@/types';

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

const QUICK_QUESTIONS = [
  { icon: '🤒', text: '목이 아프고 열이 나요' },
  { icon: '🫀', text: '가슴이 답답하고 두근거려요' },
  { icon: '🤕', text: '두통이 심하고 어지러워요' },
  { icon: '🦷', text: '오른쪽 아래 배가 심하게 아파요' },
  { icon: '📋', text: '진료 예약은 어떻게 하나요?' },
  { icon: '⏰', text: '진료 시간이 어떻게 되나요?' },
];

function TypingText({ text, animate }: { text: string; animate: boolean }) {
  const [displayed, setDisplayed] = useState(animate ? '' : text);

  useEffect(() => {
    if (!animate) { setDisplayed(text); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [text, animate]);

  return <span className="whitespace-pre-wrap">{displayed}</span>;
}

function AnalysisCard({ analysis }: { analysis: ConsultationResponse }) {
  if (analysis.classification === 'general') return null;

  return (
    <div className="ml-11 mr-4 mb-3 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CLASS_COLORS[analysis.classification] ?? 'bg-slate-100 text-slate-700'}`}>
          {CLASS_LABELS[analysis.classification] ?? analysis.classification}
        </span>
        {analysis.is_emergency && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white animate-pulse">
            🚨 응급
          </span>
        )}
      </div>

      <div className="space-y-3">
        {analysis.recommended_department && (
          <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl p-2.5">
            <Building2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">추천 진료과</p>
              <p className="text-sm font-bold text-blue-900">{analysis.recommended_department}</p>
            </div>
          </div>
        )}

        {analysis.symptoms?.length > 0 && (
          <div className="flex items-start gap-2">
            <Thermometer size={15} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">감지된 증상</p>
              <div className="flex flex-wrap gap-1">
                {analysis.symptoms.map((s, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysis.suspected_diseases?.length > 0 && (
          <div className="flex items-start gap-2">
            <Stethoscope size={15} className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">의심 가능 질환</p>
              <div className="flex flex-wrap gap-1">
                {analysis.suspected_diseases.map((d, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1">
        <Activity size={11} />
        이 분석은 참고용이며, 정확한 진단은 반드시 의사의 진찰이 필요합니다.
      </p>
    </div>
  );
}

function EmergencyBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 mb-3 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-red-800 text-sm mb-1">⚠️ 응급 상황 감지</p>
          <p className="text-red-700 text-sm leading-relaxed">{message}</p>
          <div className="flex gap-2 mt-3">
            <a
              href="tel:119"
              className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              <Phone size={14} />
              119 신고
            </a>
            <a
              href="tel:18990000"
              className="inline-flex items-center gap-1.5 bg-white text-red-600 border border-red-300 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              병원 응급실
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({ onQuickClick }: { onQuickClick: (q: string) => void }) {
  return (
    <div className="px-4 py-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-4 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} className="text-blue-200" />
          <span className="font-bold text-lg">메디봇에 오신 것을 환영합니다</span>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed">
          증상이나 진료 관련 문의를 편하게 말씀해 주세요.<br />
          AI가 증상을 분석하고 적합한 진료과를 안내해 드립니다.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: <Brain size={16} />, label: '증상 분석' },
            { icon: <Search size={16} />, label: '질환 탐색' },
            { icon: <Building2 size={16} />, label: '진료과 추천' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white/10 rounded-xl py-2 px-1">
              <div className="flex justify-center mb-1 text-blue-200">{icon}</div>
              <p className="text-xs text-blue-100 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 font-semibold mb-2 px-1">자주 묻는 질문</p>
      <div className="grid grid-cols-1 gap-2">
        {QUICK_QUESTIONS.map(({ icon, text }) => (
          <button
            key={text}
            onClick={() => onQuickClick(text)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm shadow-sm text-left"
          >
            <span className="text-base">{icon}</span>
            <span className="flex-1">{text}</span>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [latestId, setLatestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem('medi-session-id');
    if (!sid) { sid = uuidv4(); localStorage.setItem('medi-session-id', sid); }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: new Date() };
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, history }),
      });
      const data: ConsultationResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? '오류 발생');

      const newId = uuidv4();
      setLatestId(newId);
      setMessages((prev) => [
        ...prev,
        { id: newId, role: 'assistant', content: data.message, analysis: data, timestamp: new Date() },
      ]);
    } catch {
      const errId = uuidv4();
      setLatestId(errId);
      setMessages((prev) => [
        ...prev,
        { id: errId, role: 'assistant', content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
            <Pill size={17} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">메디봇</h1>
            <p className="text-xs text-slate-500">○○병원 AI 환자 상담</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg">
            <Clock size={12} />
            <span>평일 09:00–18:00</span>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200 hover:border-blue-200"
          >
            <History size={15} />
            <span className="hidden sm:inline text-xs font-medium">상담 기록</span>
          </Link>
        </div>
      </header>

      {/* Messages / Welcome */}
      <main className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <WelcomeBanner onQuickClick={(q) => { setInput(q); textareaRef.current?.focus(); }} />
        ) : (
          <div className="py-4 space-y-1">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end px-4 mb-2">
                    <div className="max-w-[78%]">
                      <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 mb-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Pill size={14} className="text-white" />
                      </div>
                      <div className="max-w-[78%]">
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-slate-800 shadow-sm">
                          <TypingText text={msg.content} animate={msg.id === latestId} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {msg.analysis && <AnalysisCard analysis={msg.analysis} />}
                {msg.analysis?.is_emergency && msg.analysis.emergency_message && (
                  <EmergencyBanner message={msg.analysis.emergency_message} />
                )}
              </div>
            ))}

            {loading && (
              <div className="px-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shrink-0">
                    <Pill size={14} className="text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="증상이나 문의사항을 입력하세요… (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              disabled={loading}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin text-slate-400" />
              : <Send size={18} />
            }
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AI 상담은 참고용입니다 · 응급 시 즉시 <strong className="text-red-500">119</strong>를 신고하세요
        </p>
      </div>
    </div>
  );
}
