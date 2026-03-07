import { fetchWithAuth } from '@/utils/apiWithAuth';
import { ChatRoomInfoRes, ChatRoomListRes, ErrorRes } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

/**
 * 내 채팅방 목록 조회
 */
export async function getMyRoom() {
  const res = await fetchWithAuth(`${API_URL}/chats`, {
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': CLIENT_ID,
    },
  });
  const data: ChatRoomInfoRes | ErrorRes = await res.json();
  if (!data.ok) throw new Error(data.message);
  return data.item;
}

/**
 * 채팅방 상세 조회(없을 경우 생성)
 */
export async function getRoomInfo({
  resourceType,
  resourceId,
}: {
  resourceType: string;
  resourceId: number;
}) {
  const res = await fetchWithAuth(
    `${API_URL}/chats/${resourceType}/${resourceId}`,
    {
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
      },
    },
  );

  const data: ChatRoomInfoRes | ErrorRes = await res.json();
  if (!data.ok) throw new Error(data.message);
  return data.item;
}
