'use client';

import useUserStore from '@/zustand/userStore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import styles from './SignUp.module.css';

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
    image: '/images/default-image.jpg',
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
    image: '/images/default-image.jpg',
  });

  //성공 상태
  const [successMessages, setSuccessMessages] = useState({
    email: '',
    name: '',
  });

  //이메일 중복확인
  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      setErrors({ ...errors, email: '이메일을 입력해주세요' });
      return;
    }

    //이메일 정규식
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ ...errors, email: '올바른 이메일 형식이 아닙니다.' });
      return;
    }
    try {
      //이메일 중복확인 API 호출
      const res = await fetch(`${API_URL}/users/email?email=${encodeURIComponent(formData.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!,
        },
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
  };

  //이름 중복확인
  const checkNameDuplicate = async () => {
    if (!formData.name) {
      setErrors({ ...errors, name: '이름을 입력해주세요.' });
      return;
    }
    if (formData.name.length < 2 || formData.name.length > 6) {
      setErrors({ ...errors, name: '이름은 2~6글자로 입력해주세요' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/name?name=${encodeURIComponent(formData.name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID!,
        },
      });
      const data = await res.json();

      if (data.ok === 1) {
        setCheckStatus({ ...checkStatus, name: true });
        setErrors({ ...errors, name: '' });
        setSuccessMessages({ ...successMessages, name: '중복확인 완료' });
      } else if (res.status === 409) {
        setCheckStatus({ ...checkStatus, name: false });
        setErrors({ ...errors, name: '이미 존재하는 이름입니다.' });
        setSuccessMessages({ ...successMessages, name: '' });
      }
    } catch (error) {
      console.error(error);
      toast.error('중복확인에 실패했습니다.');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...formData, [name]: value });
    //해당 필드 에러 지우기
    setErrors({ ...errors, [name]: '' });
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
    <div className={styles.page}>
      <ToastContainer />
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 이메일 */}
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <div className={styles.inputRow}>
              <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} className={styles.inputFlex} />
              <button type="button" onClick={checkEmailDuplicate} className={styles.checkBtn}>
                중복확인
              </button>
            </div>
            {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
            {successMessages.email && <p className={styles.successMsg}>{successMessages.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={styles.input} />
            {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className={styles.field}>
            <label className={styles.label}>Confirm Password</label>
            <input type="password" name="passwordConfirm" placeholder="Confirm Password" value={formData.passwordConfirm} onChange={handleChange} className={styles.input} />
            {errors.passwordConfirm && <p className={styles.errorMsg}>{errors.passwordConfirm}</p>}
          </div>

          {/* 이름 */}
          <div className={styles.field}>
            <label className={styles.label}>name</label>
            <div className={styles.inputRow}>
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className={styles.inputFlex} />
              <button type="button" onClick={checkNameDuplicate} className={styles.checkBtn}>
                중복확인
              </button>
            </div>
            {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
            {successMessages.name && <p className={styles.successMsg}>{successMessages.name}</p>}
          </div>

          {/* 지역 */}
          <div className={styles.field}>
            <label className={styles.label}>Region</label>
            <input type="text" name="region" placeholder="Region" value={formData.region} onChange={handleChange} className={styles.input} />
          </div>

          {/* 나이 / 성별 */}
          <div className={styles.row}>
            <div className={styles.half}>
              <label className={styles.label}>Age</label>
              <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.half}>
              <label className={styles.label}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={styles.select}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* 제출 버튼 + 로그인 링크 */}
          <div className={styles.footer}>
            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? '처리중...' : 'Sign Up'}
            </button>
            <p className={styles.loginText}>
              이미 계정이 있으세요?{' '}
              <a href="/login" className={styles.loginLink}>
                로그인 하기
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
