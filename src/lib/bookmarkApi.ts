import { BookmarksResponse, ErrorRes } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

/**
 * 사용자 북마크 목록 조회
 * @param {string} _id - 회원 ID
 * @param {string} accessToken - 인증 토큰
 * @returns {Promise<BookmarksResponse | ErrorRes>} - 북마크 목록 응답 객체
 */
export async function getUserBookmarksList(accessToken: string): Promise<BookmarksResponse | ErrorRes> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product`, {
      headers: {
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    return res.json();
  } catch (error) {
    // 네트워크 오류 처리
    console.error(error);
    return { ok: 0, message: '일시적인 네트워크 문제로 북마크 목록 조회에 실패했습니다.' };
  }
}
