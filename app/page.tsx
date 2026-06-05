'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import {
  Send, AlertTriangle, Stethoscope, Building2,
  History, Activity, ChevronRight, Loader2,
  Phone, Clock, Heart,
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

function AnalysisCard({ analysis }: { analysis: ConsultationResponse }) {
  if (analysis.classification === 'general') return null;

  return (
    <div className="ml-11 mr-4 mb-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
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
          <div className="flex items-start gap-2">
            <Building2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium">추천 진료과</p>
              <p className="text-sm font-semibold text-slate-800">{analysis.recommended_department}</p>
            </div>
          </div>
        )}

        {analysis.symptoms?.length > 0 && (
          <div className="flex items-start gap-2">
            <Activity size={15} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium">감지된 증상</p>
              <div className="flex flex-wrap gap-1 mt-1">
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
              <p className="text-xs text-slate-500 font-medium">의심 가능 질환</p>
              <div className="flex flex-wrap gap-1 mt-1">
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

      <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-2">
        ※ 이 분석은 참고용이며, 정확한 진단은 반드시 의사의 진찰이 필요합니다.
      </p>
    </div>
  );
}

function EmergencyBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 mb-3 bg-red-50 border-2 border-red-500 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-bold text-red-800 text-sm mb-1">⚠️ 응급 상황 감지</p>
          <p className="text-red-700 text-sm">{message}</p>
          <a
            href="tel:119"
            className="mt-2 inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Phone size={14} />
            119 바로 신고
          </a>
        </div>
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = [
  '목이 아프고 열이 나요',
  '오른쪽 아래 배가 심하게 아파요',
  '두통이 심하고 어지러워요',
  '진료 예약은 어떻게 하나요?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem('medi-session-id');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('medi-session-id', sid);
    }
    setSessionId(sid);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          '안녕하세요! 저는 병원 AI 상담 어시스턴트 메디봇입니다.\n\n증상이나 진료 관련 문의사항을 편하게 말씀해 주세요. 증상을 분석하여 적절한 진료과와 관련 정보를 안내해 드리겠습니다.\n\n⚠️ 모든 안내는 참고용이며 정확한 진단은 반드시 의사의 진찰이 필요합니다.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const content = input.trim();
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, session_id: sessionId, history }),
      });
      const data: ConsultationResponse & { error?: string } = await res.json();

      if (!res.ok) throw new Error(data.error ?? '오류 발생');

      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: 'assistant', content: data.message, analysis: data, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">메디봇</h1>
            <p className="text-xs text-slate-500">○○병원 AI 환자 상담</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={13} />
            <span>평일 09:00–18:00</span>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <History size={16} />
            <span className="hidden sm:inline">상담 기록</span>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end px-4 mb-2">
                <div className="max-w-[75%]">
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
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
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Heart size={15} className="text-white" />
                  </div>
                  <div className="max-w-[75%]">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap">
                      {msg.content}
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
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Heart size={15} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Questions */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2 font-medium">자주 묻는 증상</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  textareaRef.current?.focus();
                }}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1 shadow-sm"
              >
                <ChevronRight size={12} />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="증상이나 문의사항을 입력하세요… (Enter 전송 / Shift+Enter 줄바꿈)"
              rows={1}
              disabled={loading}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AI 상담은 참고용입니다 · 응급 시 즉시 <strong>119</strong>를 신고하세요
        </p>
      </div>
    </div>
  );
}
