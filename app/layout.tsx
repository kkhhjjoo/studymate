import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@/app/globals.css'
import { StudyProvider } from '@/lib/study-context'
import GoogleAuthProvider from './GoogleAuthProvider'

const notoSansKR = Noto_Sans_KR({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr'
});

export const metadata: Metadata = {
  title: 'StudyMate - 스터디 모집 플랫폼',
  description: '함께 성장하는 스터디 그룹을 찾아보세요. 스터디 모집, 참여 신청, 실시간 채팅까지 한 곳에서.',
  keywords: ['스터디', '모집', '학습', '그룹 스터디', '개발 스터디'],
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
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
