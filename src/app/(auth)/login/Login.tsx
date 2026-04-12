'use client';

import type { User } from '@/types/user';
import useUserStore from '@/zustand/userStore';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Login.module.css';

/** 환경변수: API 서버 주소와 클라이언트 식별자 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? '';

/**
 * 구글 JWT credential 문자열을 디코딩해 User 객체로 변환하는 유틸 함수.
 * 백엔드 연동 없이 구글 정보만으로 임시 사용자 객체를 생성할 때 사용한다.
 */
function userFromGoogleJwt(credential: string): User {
  try {
    // Base64URL → Base64 변환 후 UTF-8 디코딩
    const base64 = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(json);
    const sub = payload.sub ?? '';
    return {
      _id: sub,
      email: payload.email ?? '',
      name: payload.name ?? payload.email ?? '사용자',
      type: 'google',
      gender: '',
      age: 0,
      region: '',
      image: payload.picture,
      providerAccountId: sub,
    };
  } catch {
    // JWT 파싱 실패 시 빈 사용자 반환
    return { _id: '', email: '', name: '사용자', type: 'google', gender: '', age: 0, region: '' };
  }
}

/**
 * 백엔드 로그인 API 응답(JSON)을 파싱해 User 객체로 변환하는 함수.
 * 백엔드: 응답의 token 속성으로 JWT accessToken/refreshToken 반환.
 * 이후 모든 인증 요청에 Authorization: Bearer {accessToken} 사용
 */
function parseLoginResponse(data: Record<string, unknown>, credential: string): User | null {
  // 응답 구조가 다양할 수 있으므로 여러 키를 순서대로 시도
  const item = (data.item ?? data.user ?? data) as Record<string, unknown>;
  const token = (data.token ?? item?.token) as Record<string, unknown> | undefined;

  // accessToken: 다양한 키 이름을 순서대로 탐색
  const accessToken = (token?.accessToken as string) ?? (token?.access_token as string) ?? (data.accessToken as string) ?? (data.access_token as string) ?? (item?.accessToken as string) ?? (item?.access_token as string);

  // refreshToken: 다양한 키 이름을 순서대로 탐색
  const refreshToken = (token?.refreshToken as string) ?? (token?.refresh_token as string) ?? (data.refreshToken as string) ?? (data.refresh_token as string) ?? (item?.refreshToken as string) ?? (item?.refresh_token as string);

  const providerAccountId = (item?.providerAccountId ?? item?.provider_account_id ?? item?.sub ?? data.providerAccountId) as string | undefined;

  const _id = String(item?._id ?? item?.id ?? '');
  const email = String(item?.email ?? '');
  // _id와 email이 모두 없으면 유효하지 않은 응답으로 처리
  if (!_id && !email) return null;

  const user: User = {
    _id,
    email,
    name: String(item?.name ?? ''),
    type: String(item?.type ?? 'google'),
    gender: String(item?.gender ?? ''),
    age: Number(item?.age ?? 0),
    region: String(item?.region ?? ''),
    image: (item?.image ?? item?.picture) != null ? String(item.image ?? item.picture) : undefined,
  };
  if (providerAccountId) user.providerAccountId = String(providerAccountId);
  // 백엔드가 accessToken을 줬으면 token 객체에 저장, 없으면 구글 idToken 저장
  if (accessToken) user.token = { accessToken, refreshToken: refreshToken ?? accessToken };
  else user.idToken = credential;
  return user;
}

/**
 * Login 컴포넌트
 * 이메일+비밀번호 입력 폼과 구글 로그인 버튼을 렌더링한다.
 * 로그인 성공 시 Zustand 스토어에 사용자 정보를 저장하고 메인 페이지로 이동한다.
 */
const Login = () => {
  const { setUser, hasHydrated, user } = useUserStore();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false); // 이메일 로그인 제출 중 여부
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // 구글 로그인 처리 중 여부

  // 이미 로그인된 상태라면 메인 페이지로 리다이렉트
  useEffect(() => {
    if (hasHydrated && user?.token?.accessToken) router.push('/');
  }, [hasHydrated, user?.token?.accessToken, router]);

  /** 입력 필드 변경 시 formData 업데이트 */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /** 로그인 성공 시 스토어에 사용자 저장 후 홈으로 이동 */
  const loginWithUser = (u: User) => {
    setUser(u);
    router.push('/');
  };

  /**
   * 구글 OAuth 로그인 성공 콜백.
   * 백엔드 API에 credential을 전달해 서버 토큰을 받아온다.
   * API 설정이 없거나 서버 오류 시 구글 JWT만으로 폴백 로그인한다.
   */
  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      toast.error('구글 인증 정보가 없습니다.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      // 환경변수가 없으면 구글 JWT만으로 임시 로그인
      if (!API_URL || !CLIENT_ID) {
        const fallback = userFromGoogleJwt(credential);
        if (fallback._id || fallback.email) {
          fallback.idToken = credential;
          toast.info('API 설정이 없어 구글 정보로만 로그인합니다.');
          loginWithUser(fallback);
        } else toast.error('.env에 NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CLIENT_ID를 설정해 주세요.');
        return;
      }

      // 백엔드 구글 로그인 API 호출
      const res = await fetch(`${API_URL}/users/login/with`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Id': CLIENT_ID },
        body: JSON.stringify({ credential }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      // 성공 응답이면 User 객체로 변환 후 로그인
      const user = res.ok ? parseLoginResponse(data, credential) : null;
      if (user) {
        if (!user.token?.accessToken && process.env.NODE_ENV === 'development') {
          console.warn('[구글 로그인] 백엔드가 accessToken을 반환하지 않았습니다. 응답:', data);
        }
        loginWithUser(user);
        return;
      }

      // 개발 환경에서 서버 오류 로그 출력
      if (process.env.NODE_ENV === 'development' && res.status !== 200) {
        console.warn('[구글 로그인] 백엔드 응답', res.status, data);
      }
      const errMsg = (data.message ?? data.error) as string | undefined;
      toast.error(errMsg ?? (res.status === 401 ? '인증에 실패했습니다.' : '구글 로그인에 실패했습니다.'));

      // 서버 오류가 있어도 구글 정보로 폴백 로그인 시도
      const fallback = userFromGoogleJwt(credential);
      if (fallback._id || fallback.email) {
        fallback.idToken = credential;
        toast.info('서버 연동 없이 로그인합니다. 일부 기능이 제한될 수 있습니다.');
        loginWithUser(fallback);
      }
    } catch (err) {
      // 네트워크 오류 등 예외 상황에도 구글 JWT로 폴백 로그인 시도
      const fallback = userFromGoogleJwt(credential);
      if (fallback._id || fallback.email) {
        fallback.idToken = credential;
        toast.info('오류가 발생해 구글 정보로 로그인합니다.');
        loginWithUser(fallback);
      } else toast.error(err instanceof Error ? err.message : '구글 로그인에 실패했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * 이메일/비밀번호 로그인 폼 제출 핸들러.
   * 백엔드 /users/login API에 요청을 보내고 응답을 파싱해 로그인 처리한다.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 필수 입력값 검증
    if (!formData.email || !formData.password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!API_URL || !CLIENT_ID) {
      toast.error('API 설정이 없습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Id': CLIENT_ID },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = (await res.json()) as Record<string, unknown> & { message?: string; errors?: Record<string, { msg?: string }> };
      if (!res.ok) {
        // 서버 검증 오류 메시지 조합
        let msg = data.message ?? '로그인에 실패했습니다.';
        if (data.errors && typeof data.errors === 'object') {
          const msgs = Object.values(data.errors)
            .map((e) => (e as { msg?: string })?.msg)
            .filter(Boolean) as string[];
          if (msgs.length) msg = msgs.join(', ');
        }
        throw new Error(msg);
      }
      const user = parseLoginResponse(data, '');
      if (user) loginWithUser(user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  const content = (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.wrapper}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 이메일 */}
          <div>
            <label className={styles.label}>이메일</label>
            <input type="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} className={styles.input} />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className={styles.fieldGroup}>비밀번호</label>
            <input type="password" name="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} className={styles.input} />
          </div>

          {/* 로그인 버튼 + 회원가입 링크 */}
          <div className={styles.formButton}>
            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? '로그인 중...' : 'Login'}
            </button>
            <p className={styles.signupText}>
              아직 계정이 없으세요?{' '}
              <a href="/signup" className={styles.signupLink}>
                회원가입 하기
              </a>
            </p>
          </div>
        </form>

        {/* 구글 로그인 */}
        <div className={styles.divider}>
          <p className={styles.dividerText}>- 또는 -</p>
          {clientId ? (
            <div className={styles.googleWrapper}>
              {isGoogleLoading && <p className={styles.googleLoadingText}>구글 로그인 중...</p>}
              {/* 구글 OAuth 로그인 버튼 */}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setIsGoogleLoading(false);
                  toast.error('구글 로그인에 실패했습니다.');
                }}
              />
            </div>
          ) : (
            // 환경변수 미설정 시 안내 메시지 표시
            <p className={styles.googleEnvNotice}>Google 로그인을 사용하려면 .env에 NEXT_PUBLIC_GOOGLE_CLIENT_ID를 설정해주세요.</p>
          )}
        </div>
      </div>
    </div>
  );

  return clientId ? <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider> : content;
};

export default Login;
