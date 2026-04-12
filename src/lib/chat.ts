import { ChatRoomInfoRes, ChatRoomListRes, ErrorRes } from '@/types/api';

const API_URL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL
    : '/api/proxy';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

type FetchWithAuthOptions = RequestInit & {
  requireAuth?: boolean;
};

async function fetchWithAuth(url: string, options: FetchWithAuthOptions = {}) {
  const { requireAuth, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    ...(headers || {}),
  };

  if (requireAuth && typeof window !== 'undefined') {
    const token = window.localStorage.getItem('accessToken');
    if (token) {
      (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
  });
}

/**
 * 내 채팅방 목록 조회
 */
export async function getMyRoom() {
  const res = await fetchWithAuth(`${API_URL}/chats`, {
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
      ...(CLIENT_ID ? { 'Client-Id': CLIENT_ID } : {}),
    } as HeadersInit,
  });
  const data: ChatRoomListRes | ErrorRes = await res.json();
  if (!data.ok) throw new Error(data.message);
  return data.item;
}

/**
 * 채팅방 상세 조회(없을 경우 생성)
 */
export async function getRoomInfo({ resourceType, resourceId }: { resourceType: string; resourceId: number }) {
  const res = await fetchWithAuth(`${API_URL}/chats/${resourceType}/${resourceId}`, {
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
      ...(CLIENT_ID ? { 'Client-Id': CLIENT_ID } : {}),
    } as HeadersInit,
  });

  const data: ChatRoomInfoRes | ErrorRes = await res.json();
  if (!data.ok) throw new Error(data.message);
  return data.item;
}
