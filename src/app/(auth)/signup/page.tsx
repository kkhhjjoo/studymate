/**
 * page.tsx (회원가입)
 * Next.js App Router의 /signup 경로에 해당하는 페이지 파일.
 * SignUp 컴포넌트를 감싸서 렌더링하는 진입점 역할을 한다.
 */

import SignUp from '@/app/(auth)/signup/SignUp'
import React from 'react'

/** /signup 페이지 컴포넌트 — SignUp 컴포넌트를 반환한다. */
const Register = () => {
  return (
    <div>
      <SignUp />
    </div>
  )
}

export default Register
