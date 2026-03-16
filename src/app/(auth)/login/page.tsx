/**
 * page.tsx (로그인)
 * Next.js App Router의 /login 경로에 해당하는 페이지 파일.
 * Login 컴포넌트를 불러와 렌더링하는 진입점 역할을 한다.
 */

import Login from '@/app/(auth)/login/Login'

/** /login 페이지 컴포넌트 — Login 컴포넌트를 그대로 반환한다. */
export default function LoginPage() {
  return <Login />
}
