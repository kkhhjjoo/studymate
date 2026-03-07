import { User } from '@/types/user';
import { ChatRoom } from './chat';

//회원 정보 응답 타입
export interface UserInfoRes {
  ok: 1;
  item: User;
}
// 에러 타입
export interface ErrorRes {
  ok: 0;
  message: string;
  errors?: {
    [fieldName: string]: ServerValidationError;
  };
}
// 서버 검증 에러 타입
export interface ServerValidationError {
  type: string;
  value: string;
  msg: string;
  location: string;
}
export interface ChatRoomListRes {
  ok: 1;
  item: ChatRoom[];
}
export interface ChatRoomInfoRes {
  ok: 1;
  item: ChatRoom;
}
