import { ErrorRes, UserInfoRes } from '@/types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

/**
 * 회원 정보 조회
 * @param {string} _id - 회원 ID
 * @returns {Promise<UserRes | ErrorRes>} - 회원 정보 응답 객체
 */
export async function getUserInfo(
  _id: string,
): Promise<UserInfoRes | ErrorRes> {
  try {
    const res = await fetch(`${API_URL}/users/${_id}`, {
      headers: {
        'Client-Id': CLIENT_ID,
      },
      cache: 'no-store',
      next: {
        tags: [`users/${_id}`],
      },
    });
    return res.json();
  } catch (error) {
    // 네트워크 오류 처리
    console.error(error);
    return {
      ok: 0,
      message: '일시적인 네트워크 문제로 회원 정보 조회에 실패했습니다.',
    };
  }
}
