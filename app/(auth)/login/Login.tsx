'use client'

import type { User } from '@/types/user';
import useUserStore from '@/zustand/userStore';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

const Login = () => {
  const { setUser, hasHydrated, user } = useUserStore();
  const accessToken = user?.token?.accessToken;
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.push('/');
    }
  }, [hasHydrated, accessToken]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error('구글 인증 정보가 없습니다.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      if (API_URL && CLIENT_ID) {
        const res = await fetch(`${API_URL}/users/login/with`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Id': CLIENT_ID,
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        });

        const data = await res.json();
        if (res.ok && data.item) {
          setUser(data.item);
          router.push('/');
          return;
        }
      }

      // API 미지원 시: 구글 JWT 디코딩 후 로컬 로그인 처리
      const base64 = credentialResponse.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      setUser({
        _id: payload.sub,
        email: payload.email ?? '',
        name: payload.name ?? payload.email ?? '사용자',
        type: 'google',
        gender: '',
        age: 0,
        region: '',
        image: payload.picture,
      });
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '구글 로그인에 실패했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = (await res.json()) as { message?: string; errors?: Record<string, { msg?: string }>; item?: User };
      if (!res.ok) {
        let errMsg = data.message || '로그인에 실패했습니다.';
        if (data.errors && typeof data.errors === 'object') {
          const msgs = Object.values(data.errors).map((e) => e?.msg).filter(Boolean) as string[];
          if (msgs.length) errMsg = msgs.join(', ');
        }
        throw new Error(errMsg);
      }
      if (data.item) setUser(data.item);
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFF] flex items-center justify-center px-4">
      <ToastContainer />
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Email address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* 로그인 버튼 + 회원가입 링크 */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#C0392B] text-white font-semibold rounded-lg hover:bg-[#A93226] disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? '로그인 중...' : 'Login'}
            </button>
            <p className="text-sm text-gray-600">
              아직 계정이 없으세요?{' '}
              <a href="/signup" className="text-blue-500 hover:underline">
                회원가입 하기
              </a>
            </p>
          </div>
        </form>

        {/* 구글 로그인 */}
        <div className="mt-8">
          <p className="text-center text-sm text-gray-500 mb-4">- 또는 -</p>
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-3">
              {isGoogleLoading && (
                <p className="text-sm text-gray-500">구글 로그인 중...</p>
              )}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setIsGoogleLoading(false);
                  toast.error('구글 로그인에 실패했습니다.');
                }}
              />
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Google 로그인을 사용하려면 .env에 NEXT_PUBLIC_GOOGLE_CLIENT_ID를 설정해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
