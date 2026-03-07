'use client';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, ChatRoom, ChatRoomState } from '@/lib/types/chat';
import { User } from '@/types/user';
import { getMyRoom } from '@/lib/chat';
import { isIP } from 'net';

const SERVER = process.env.NEXT_PUBLIC_PRIVATE_CHAT_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

interface ChatStoreState {
  chatSocket: Socket | null;
  isConnecting: boolean; //채팅 소켓 연결중인지 여부
  isInitialized: boolean; // 방 목록 조회가 완료되었는지 여부
  messagesByRoom: Record<number, ChatMessage[]>; //채팅룸 별 메시지
  rooms: ChatRoomState[]; //채팅 룸 목록(메시지는 포함 안됨)
  activeRoomId: number | undefined; //현재 활성화된 채팅 룸

  //Actions
  connectSocket: (user: User) => void; //채팅 소켓 연결
  disconnectSocket: () => void; //채팅 소켓 연결 해제
  setMessages: (roomId: number, messages: ChatMessage[]) => void; //패팅룸 별 메시지 설정
  setActiveRoomId: (roomId: number | undefined) => void; //현재 활성화된 채팅 룸 설정
  setRooms: (serverRooms: ChatRoom[], userId: number) => void; //채팅 룸 목록 설정
  addRooms: (room: ChatRoom, userId: number) => void; //채팅 룸 추가
  leaveRoom: (roomId: number ) => void; //채팅 룸 제거
}

//싱글톤 패턴으로 채팅 소켓을 관리
//채팅 서버에 연결하고, 사용자 전용 룸을 생성하고, 수신한 메시지를 저장
const useChatStore = create<ChatStoreState>((set, get) => ({
    chatSocket: null,
    isConnecting: false,
    isInitializedL false,
    messagesByRoom: {},
    rooms: [],
    activeRoomId: undefined,

    //채팅 소켓 연결
    connectSocket: async (user: User) => {
        //로그인 정보가 없거나 소켓 연결 중이거나 연결이 된 상태면 연결하지 않음
        if (!user || get().chatSocket?.connected || get().isConnecting)
            return;
        console.log('채팅 서버 연결 시도...');
        set({isConnecting: true}); //상태 변경

        try {
            //채팅 웹소켓 서버 연결
            const socket = io(`${SERVER}/${CLIENT_ID}`, {
                transports: ['websocket'], //HTTP 폴링 방식 대신 웹소켓으로 바로 연결
                reconnectionAttempts: 5, //연결 실패시 5번 재시도
            });

            //connec: 웹소켓 서버에 성공적으로 연결되엇을때 발생하는 이벤트
            socket.on('connect', () => {
                console.log('채팅 서버 연결 완료');
                set({chatSocket: socket, isConnecting: false}); //상태 변경

                //메시지 수신을 위한 사용자 id등록
                socket.emit('setUser', {userId: user._id, name: user.name})
            

            //현재 활성화된 방 유지(연결이 끊긴 후 재연결 될때 활성화된 방 인식)
            const roomId = get().activeRoomId;
            if (roomId) socket.emit('setActiveRoomId', roomId);
        });

        //채팅 메세지 수신시 발생하는 이벤트(채팅 서버에서 커스텀으로 정의한 이벤트)
        socket.on('message', async (msg: ChatMessage & {roomId: number}) => {
            const state = get();
            cosnt roomId = msg.roomId;
            const targetRooms = state.rooms.find(room => room._id === roomId);

            //1. 만약 채팅 목록에 없는 방의 메시지라면, 방 목록을 새로 고침
            if (!targetRoom) {
                const serverRooms = await getMyRooms();
                get().setRooms(serverRooms, user._id);
                return;
            }

            //2. 활성화된 채팅룸의 메시지 목록 및 상태 업데이트
            set((state) => {
                const currentMessages = state.messagesByRoom[roomId] || [];
                const updatedMessages = [...currentMessages, msg];

                const otherRooms = state.rooms.filter(room => room._id !== roomId);
                const isMyMessage = msg.senderId == user._id;
                const isActiveRoom = state.activeRoomId === roomId;

                const updatedRoom: ChatRoomState = {
                    ..targetRoom,
                    lastMessage: msg,
                    unreadCount: !isMyMessage && !isActiveRoom ? (targetRoom.unreadCount || 0) + 1 : targetRooms.unreadCount
                };

                retunr {
                    messagesByRoom: {...state.messagesByRoom, [roomId]:updatedMessages},
                    rooms: [updatedRoom, ...otherRooms]
                };
            });
        });

        //연결 에러
        Socket.on('connect_error', () => set({isConnecting: false}));

        //연결이 끊어졌을 경우 소켓을 null로 초기화
        Socket.on('disconnect', () => set({chatSocket: null, isConnection: false}));

        //상대방의 메시지 읽음 확인 신호 수신
        Socket.on('readReceipt', ({roomId, userId}: {roomId: number; userId: number}) => {
            set((state) => {
                const currentMessages = state.messagesByRoom[roomId] || [];
                if (currentMessages.length === 0) return state;

                const updatedMessages = currentMessages.map((msg) => ({
                    ...msg,
                    readUserIds: msg.readUserIds.includes(userId) ? msg.readUserIds : [...msg.readUserIds, userId],
                }));

                return {
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: updatedMessages,
                    }
                };
            });
        });

        set({chatSocket: socket});

        //리스너 등록 후 방 목록 API 호출
        const serverRooms = await getMyRooms();
        get().setRooms(serverRooms, user._id);
        } catch (error) {
            console.error('채팅 서버 연결 실패:', error);
            set({isConnecting: false});
        }
    },

    //채팅 소켓 연결 해제
    disconnectSocket: () => {
        const {chatSocket} = get();
        if (chatSocket) {
            chatSocket.disconnect();
            set({chatSocket: null, isConnecting: false});
            console.log('채팅 소켓 연결 해제됨')
        }
    },
    //채팅룸 별 메시지 설정(해당 룸 선택시 api 서버에서 룸 상세정보 조회 후 호출 )
    setMessages: (roomId, messages) => 
        set((state) => ({
            messagesByRoom: {...state.messagesByRoom, [roomId]: messages}
        })),

        //보고 있는 채팅룸 지정
        setActiveRoomId: roomId => set((state) => ({activeRoomId: roomId,
            //활성화된 방의 읽지 않은 메시지 수를 0으로 초기화
            rooms: state.rooms.map(room => room._id === roomId ? {
                ...room, unreadCount: 0
            }: room),
        })),
        //채팅 룸 목록 설정(채팅방 목록 조회후 호출됨)
        setRooms: (serverRooms, userId) => {
            const rooms: ChatRoomState[] = serverRooms.map((room) => ({
                ...rooms,
                lastMessage: room.messages.at(-1),
                unreadCount: room.messages.filter(msg => !msg.readUserIds.includes(userId)).length,
            }));
            set({rooms, isInitialized: true});
        },

        //채팅방 추가(이미 목록에 있으면 놔두고 없으면 추가)
        addRooms: (room, userId) => set((state) => {
            const exists = state.rooms.some((r) => r._id === room._id);
            if (exists) return state; //이미 목록에 있으면 상태 변경 없음

            //새로운 방을 ChatRoomState형식으로 변환
            const newRoom: ChatRoomState = {
                ...room,
                lastMessage: room.messages.at(-1),
                unreadCount: room.mesages.filter((msg) => !msg.readUserIds.includes(userId)).length || 0,
            };
            return {
                rooms: [newRoom, ...state.rooms],
            };
        }),

        //채팅방 나가기(채팅 목록에서 삭제)
        leaveRoom: (roomId) => set((state) => {
            const updatedRooms = state.rooms.filter((room) => room._id === roomId? false : true);
            const newMessagesByRoom = {...state.messagesByRoom};
            delete newMessagesByRoom[roomId];

            return {
                rooms: updataedRooms,
                messagesByRoom: newMessagesByRoom,
                activeRoomId: state.activeRoomId === roomId ? undefined : state.activeRoomId,
            };
        }),
}));

export default useChatStore;