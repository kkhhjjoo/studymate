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

  setMessages: (roomId, messages) =>
    set((state) => ({
      messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
    })),

  setActiveRoomId: (roomId) =>
    set((state) => ({
      activeRoomId: roomId,
      rooms: state.rooms.map((room) =>
        room._id === roomId ? { ...room, unreadCount: 0 } : room
      ),
    })),

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
