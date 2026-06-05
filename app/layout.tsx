import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: '메디봇 - 병원 AI 환자 상담',
  description: 'AI 기반 병원 환자 상담 서비스. 증상 분석, 진료과 추천, 응급 여부 판단을 제공합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
