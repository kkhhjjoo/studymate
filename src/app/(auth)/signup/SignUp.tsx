/**
 * SignUp.tsx
 * 회원가입 폼 컴포넌트.
 * 이메일/닉네임 중복 확인, 비밀번호 일치 검증 후 백엔드 API에 회원 등록 요청을 보낸다.
 * 가입 성공 시 /login 페이지로 이동한다.
 */

'use client'

import useUserStore from '@/zustand/userStore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';


const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

const SignUp = () => {
  const { user } = useUserStore();
  const accessToken = user?.token?.accessToken;
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const router = useRouter();



  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.push('/');
    }
  }, [hasHydrated, accessToken]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  //회원가입 버튼 눌렀을 째 제출중인지 체크

  const [formData, setData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    region: '',
    age: '',
    gender: '',
    image: '/images/default-image.jpg'
  });

  //중복 확인 상태 추가
  const [checkStatus, setCheckStatus] = useState({
    email: false, //이메일 중복확인 완료 여부
    name: false, //이름 중복확인 완료 여부
  });

  //에러 상태 추가
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    region: '',
    age: '',
    gender: '',
    image: '/images/default-image.jpg'
  });

  //성공 상태
  const [successMessages, setSuccessMessages] = useState({
    email: '',
    name: ''
  })

  //이메일 중복확인
  const checkEmailDuplicate = async () => {
    if (!formData.email) { 
      setErrors({ ...errors, email: '이메일을 입력해주세요' });
      return;
    }

    //이메일 정규식
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) { 
      setErrors({ ...errors, email: '올바른 이메일 형식이 아닙니다.' }
      
      );
      return;
    }
    try {
      //이메일 중복확인 API 호출
      const res = await fetch(`${API_URL}/users/email?email=${encodeURIComponent(formData.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!
        }
      });
      const data = await res.json();

      console.log('이메일 중복확인 응답', data);
      console.log('응답 상태:', res.status);

      //HTTP 상태 코드 먼저 체크
      if (!res.ok) {
        //422, 409 등 에러 응답 처리
        if (res.status === 409) {
          setCheckStatus({ ...checkStatus, email: false });
          //중복확인 실패

          setErrors({ ...errors, email: '이미 존재하는 이메일 입니다.' });
          setSuccessMessages({ ...successMessages, email: '' });

        } else {
          throw new Error(data.message || '이메일 확인 실패');
          //다른 에러가 뜬 경우 예상못한 에러를 catch로 보냄
        }
        return;
      }

      //200 응답일때만 data.ok 체크
      if (data.ok === 1) {
        setCheckStatus({ ...checkStatus, email: true });
        setErrors({ ...errors, email: '' });
        setSuccessMessages({ ...successMessages, email: '중복 확인 완료' });
        
      } else {
        setCheckStatus({ ...checkStatus, email: false });
        setErrors({ ...errors, email: data.message || '사용할 수 없는 이메일입니다.' });
        setSuccessMessages({ ...successMessages, email: '' });
      }
    } catch (error) { 
      console.error(error);
      setCheckStatus({ ...checkStatus, email: false });
      setErrors({ ...errors, email: '이메일 중복확인에 실패했습니다.' });
      setSuccessMessages({ ...successMessages, email: '' });
    }
  }
  
  //이름 중복확인
  const checkNameDuplicate = async () => { 
    if (!formData.name) { 
      setErrors({ ...errors, name: '이름을 입력해주세요.' });
      return;
    }
    if (formData.name.length < 2 || formData.name.length > 6) { 
      setErrors({ ...errors, name: '이름은 2~6글자로 입력해주세요' }
      );
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/name?name=${encodeURIComponent(formData.name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!
        },
      });
      const data = await res.json();

      if (data.ok === 1) { 
        setCheckStatus({ ...checkStatus, name: true });
        setErrors({ ...errors, name: '' });
        setSuccessMessages({...successMessages, name: '중복확인 완료'})
      } else if (res.status === 409 ) {
        setCheckStatus({ ...checkStatus, name: false });
        setErrors({ ...errors, name: '이미 존재하는 이름입니다.' });
        setSuccessMessages({ ...successMessages, name: '' });
       }
    } catch (error) { 
      console.error(error);
      toast.error('중복확인에 실패했습니다.')
    }
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...formData, [name]: value });
    //해당 필드 에러 지우기
    setErrors({ ...errors, [name]: ''});
  };

  //회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkStatus.email) {
      setErrors((prev) => ({ ...prev, email: '이메일 중복확인을 해주세요.' }));
      return;
    }
    if (!checkStatus.name) {
      setErrors((prev) => ({ ...prev, name: '닉네임 중복확인을 해주세요.' }));
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setErrors((prev) => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!,
        },
        body: JSON.stringify({
          type: 'user',
          loginId: formData.email,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          region: formData.region,
          age: formData.age ? Number(formData.age) : undefined,
          gender: formData.gender || undefined,
          image: formData.image,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('회원가입 실패 상세:', errData);
        throw new Error(errData.message || `오류 코드: ${res.status}`);
      }
      toast.success('회원가입이 완료되었습니다!');
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
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
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={checkEmailDuplicate}
                className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            {successMessages.email && <p className="mt-1 text-xs text-green-600">{successMessages.email}</p>}
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
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Confirm Password</label>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="Confirm Password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            {errors.passwordConfirm && <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm}</p>}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">name</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={checkNameDuplicate}
                className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            {successMessages.name && <p className="mt-1 text-xs text-green-600">{successMessages.name}</p>}
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Region</label>
            <input
              type="text"
              name="region"
              placeholder="Region"
              value={formData.region}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* 나이 / 성별 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800 mb-1">Age</label>
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* 제출 버튼 + 로그인 링크 */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#7C3AED] text-white font-semibold rounded-lg hover:bg-[#5B21B6] disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? '처리중...' : 'Sign Up'}
            </button>
            <p className="text-sm text-gray-600">
              이미 계정이 있으세요?{' '}
              <a href="/login" className="text-blue-500 hover:underline">
                로그인 하기
              </a>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SignUp
