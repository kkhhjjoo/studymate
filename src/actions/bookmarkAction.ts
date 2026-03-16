import { BookmarksInfoRes, ErrorRes } from '@/types/api';
import { Bookmarks } from '@/types/bookmarks';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

type ActionState = ErrorRes | null;

/* 북마크 추가 — 성공 시 생성된 Bookmarks 객체 반환, 실패 시 null */
export async function addBookmarks(target_id: number, accessToken: string): Promise<Bookmarks | null> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ target_id }),
    });
    const data = (await res.json()) as Record<string, unknown> & { ok?: number; item?: Bookmarks };
    const ok = Number(data?.ok) === 1 || res.ok;
    if (ok && data?.item != null) return data.item as Bookmarks;
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

//북마크 삭제
export async function deleteBookmark(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const accessToken = formData.get('accessToken');
  const _id = formData.get('_id');

  let res: Response;
  let data: BookmarksInfoRes | ErrorRes;

  try {
    res = await fetch(`${API_URL}/bookmarks/${_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    data = await res.json();
  } catch (error) {
    console.error(error);
    return { ok: 0, message: '일시적인 네트워크 문제로 삭제에 실패했습니다' };
  }
  if (data.ok) {
    return null; //성공시 null반환
  } else {
    return data; //에러 응답 객체 반환
  }
}
