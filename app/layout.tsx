import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { StudyProvider } from '@/lib/study-context'
import GoogleAuthProvider from './GoogleAuthProvider'

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'StudyMate - 스터디 모집 플랫폼',
  description: '함께 성장하는 스터디 그룹을 찾아보세요. 스터디 모집, 참여 신청, 실시간 채팅까지 한 곳에서.',
  keywords: ['스터디', '모집', '학습', '그룹 스터디', '개발 스터디'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased`}>
        <GoogleAuthProvider>
          <StudyProvider>
            {children}
          </StudyProvider>
        </GoogleAuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
