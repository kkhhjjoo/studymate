/**
 * zustand/chatStore.ts
 * 실시간 채팅 전역 상태 관리 스토어.
 * Socket.IO를 통해 채팅 서버에 연결하고, 채팅방 목록과 메시지를 관리한다.
 * 메시지 수신 시 안 읽은 메시지 수(unreadCount)를 자동으로 업데이트한다.
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, ChatRoom, ChatRoomState } from '@/types/chat';
import { User } from '@/types/user';
import { getMyRoom } from '@/lib/chat';

const SERVER = process.env.NEXT_PUBLIC_PRIVATE_CHAT_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

interface ChatStoreState {
  chatSocket: Socket | null;
  isConnecting: boolean;
  isInitialized: boolean;
  messagesByRoom: Record<string, ChatMessage[]>;
  rooms: ChatRoomState[];
  activeRoomId: string | undefined;

  connectSocket: (user: User) => void;
  disconnectSocket: () => void;
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  setActiveRoomId: (roomId: string | undefined) => void;
  setRooms: (serverRooms: ChatRoom[], userId: string) => void;
  addRooms: (room: ChatRoom, userId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const useChatStore = create<ChatStoreState>((set, get) => ({
  chatSocket: null,
  isConnecting: false,
  isInitialized: false,
  messagesByRoom: {},
  rooms: [],
  activeRoomId: undefined,

  connectSocket: async (user: User) => {
    if (!user || get().chatSocket?.connected || get().isConnecting) return;
    console.log('채팅 서버 연결 시도...');
    set({ isConnecting: true });

    try {
      const socket = io(`${SERVER}/${CLIENT_ID}`, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('채팅 서버 연결 완료');
        set({ chatSocket: socket, isConnecting: false });
        socket.emit('setUser', { userId: user._id, name: user.name });

        const roomId = get().activeRoomId;
        if (roomId) socket.emit('setActiveRoomId', roomId);
      });

      socket.on('message', async (msg: ChatMessage & { roomId: string }) => {
        const state = get();
        const roomId = msg.roomId;
        const targetRoom = state.rooms.find((room) => room._id === roomId);

        if (!targetRoom) {
          const serverRooms = await getMyRoom();
          get().setRooms(Array.isArray(serverRooms) ? serverRooms as ChatRoom[] : [serverRooms as unknown as ChatRoom], user._id);
          return;
        }

        set((state) => {
          const currentMessages = state.messagesByRoom[roomId] || [];
          const updatedMessages = [...currentMessages, msg];
          const otherRooms = state.rooms.filter((room) => room._id !== roomId);
          const isMyMessage = msg.senderId === user._id;
          const isActiveRoom = state.activeRoomId === roomId;

          const updatedRoom: ChatRoomState = {
            ...targetRoom,
            lastMessage: msg,
            unreadCount:
              !isMyMessage && !isActiveRoom
                ? (targetRoom.unreadCount || 0) + 1
                : targetRoom.unreadCount,
          };

          return {
            messagesByRoom: { ...state.messagesByRoom, [roomId]: updatedMessages },
            rooms: [updatedRoom, ...otherRooms],
          };
        });
      });

      socket.on('connect_error', () => set({ isConnecting: false }));
      socket.on('disconnect', () => set({ chatSocket: null, isConnecting: false }));

      socket.on('readReceipt', ({ roomId, userId }: { roomId: string; userId: string }) => {
        set((state) => {
          const currentMessages = state.messagesByRoom[roomId] || [];
          if (currentMessages.length === 0) return state;

          const updatedMessages = currentMessages.map((msg) => ({
            ...msg,
            readUserIds: msg.readUserIds?.includes(userId)
              ? msg.readUserIds
              : [...(msg.readUserIds ?? []), userId],
          }));

          return {
            messagesByRoom: { ...state.messagesByRoom, [roomId]: updatedMessages },
          };
        });
      });

      set({ chatSocket: socket });

      const serverRooms = await getMyRoom();
      get().setRooms(Array.isArray(serverRooms) ? serverRooms as ChatRoom[] : [serverRooms as unknown as ChatRoom], user._id);
    } catch (error) {
      console.error('채팅 서버 연결 실패:', error);
      set({ isConnecting: false });
    }
  },

  disconnectSocket: () => {
    const { chatSocket } = get();
    if (chatSocket) {
      chatSocket.disconnect();
      set({ chatSocket: null, isConnecting: false });
      console.log('채팅 소켓 연결 해제됨');
    }
  },

  /** 특정 방의 메시지 목록을 덮어씀 (초기 메시지 로드 시 사용) */
  setMessages: (roomId, messages) =>
    set((state) => ({
      messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
    })),

  /** 현재 활성 채팅방 설정 + 해당 방 읽지 않은 메시지 수 초기화 */
  setActiveRoomId: (roomId) =>
    set((state) => ({
      activeRoomId: roomId,
      rooms: state.rooms.map((room) =>
        room._id === roomId ? { ...room, unreadCount: 0 } : room
      ),
    })),

  /** 서버에서 받은 채팅방 목록을 ChatRoomState로 변환해 저장 */
  setRooms: (serverRooms, userId) => {
    const rooms: ChatRoomState[] = serverRooms.map((room) => ({
      ...room,
      lastMessage: (room as any).messages?.at(-1),
      unreadCount:
        (room as any).messages?.filter(
          (msg: ChatMessage) => !(msg.readUserIds ?? []).includes(userId)
        ).length ?? 0,
    }));
    set({ rooms, isInitialized: true });
  },

  /** 새 채팅방 추가 (중복이면 무시) */
  addRooms: (room, userId) =>
    set((state) => {
      const exists = state.rooms.some((r) => r._id === room._id);
      if (exists) return state;

      const newRoom: ChatRoomState = {
        ...room,
        lastMessage: (room as any).messages?.at(-1),
        unreadCount:
          (room as any).messages?.filter(
            (msg: ChatMessage) => !(msg.readUserIds ?? []).includes(userId)
          ).length ?? 0,
      };
      return { rooms: [newRoom, ...state.rooms] };
    }),

  /** 채팅방 퇴장: 방 목록과 메시지 목록에서 제거 */
  leaveRoom: (roomId) =>
    set((state) => {
      const updatedRooms = state.rooms.filter((room) => room._id !== roomId);
      const newMessagesByRoom = { ...state.messagesByRoom };
      delete newMessagesByRoom[roomId];

      return {
        rooms: updatedRooms,
        messagesByRoom: newMessagesByRoom,
        activeRoomId: state.activeRoomId === roomId ? undefined : state.activeRoomId,
      };
    }),
}));

export default useChatStore;
