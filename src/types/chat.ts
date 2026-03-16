/**
 * types/chat.ts
 * 실시간 채팅 관련 타입 정의.
 * Socket.IO 기반 채팅 서버와 통신할 때 사용하는 메시지, 멤버, 채팅방 타입을 정의한다.
 */

/** 채팅 메시지 타입 */
export interface ChatMessage {
  _id?: string | number;
  roomId?: string;
  senderId: string; // 발신자 userId
  readUserIds?: string[]; // 메시지를 읽은 userId 목록
  content: string;
  createdAt: string;
}

/** 채팅방 멤버 타입 */
export interface ChatMember {
  _id: string;
  name: string;
  image?: string;
  leftAt?: string; // 채팅방을 떠난 시간 (퇴장한 경우)
}

/** 채팅방 타입 */
export interface ChatRoom {
  _id: string;
  resourceType: string; // 채팅방이 연결된 리소스 종류 (예: product)
  resourceId: number; // 연결된 리소스 ID
  roomName: string;
  ownerId: string;
  members: ChatMember[];
  updatedAt: string;
  createdAt: string;
}

/** 채팅방 상태 타입 — UI 렌더링을 위해 unreadCount와 lastMessage를 추가 */
export interface ChatRoomState extends ChatRoom {
  unreadCount: number; // 읽지 않은 메시지 수
  lastMessage?: ChatMessage; // 가장 최근 메시지
}
