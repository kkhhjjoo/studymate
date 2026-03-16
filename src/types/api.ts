import { Bookmarks } from '@/types/bookmarks';
import { ChatRoom } from '@/types/chat';
import { Manage } from '@/types/manage';
import { Study } from '@/types/studies';
import { User } from '@/types/user';

// 스터디 API 응답에서 사용하는 DB 상품 타입
export interface ApiProduct extends Study {
  _id?: number | string;
}

// 스터디 목록 조회 응답 타입
export interface StudyListRes {
  ok: 1;
  item: ApiProduct;
  items: ApiProduct[];
}

// 스터디 상세 조회 응답 타입
export interface StudyInfoRes {
  ok: 1;
  item: ApiProduct;
}

// 스터디 생성 응답 타입
export interface CreateStudyRes {
  ok: 1;
  item: {
    _id: number;
  };
}
// 신청한 리스트 관리 응답 타입
export interface ManageListRes {
  ok: 1;
  item: Manage[];
}
// 회원 정보 응답 타입
export interface UserInfoRes {
  ok: 1;
  item: User;
}

// 북마크 한개의 응답타입
export interface BookmarksInfoRes {
  ok: 1;
  item: Bookmarks;
}

// 북마크 리스트의 응답타입
export interface BookmarksResponse {
  ok: number;
  item: Bookmarks[];
}

export interface ChatRoomListRes {
  ok: 1;
  item: ChatRoom[];
}

export interface ChatRoomInfoRes {
  ok: 1;
  item: ChatRoom;
}

// 파일 업로드 결과 타입
export interface FileUploadRes {
  ok: 1;
  item: {
    name: string;
    path: string;
  }[];
}

// 서버 검증 에러 타입
export interface ServerValidationError {
  type: string;
  value: string;
  msg: string;
  location: string;
}

// 에러 응답 타입
export interface ErrorRes {
  ok: 0;
  message: string;
  errors?: {
    [fieldName: string]: ServerValidationError;
  };
}
