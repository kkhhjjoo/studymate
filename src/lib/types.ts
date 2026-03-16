/** 상품 스키마: API 등에서 사용하는 상품 데이터 형식 */
export interface Product {
  id?: string;
  price: number;
  quantity: number;
  name: string;
  content: string;
  shippingFees?: number;
  mainImages?: string[];
  show?: boolean;
  extra?: Record<string, unknown>;
}

/** 스터디 데이터 타입 */
export interface Study {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  maxMembers: number; // 최대 모집 인원
  currentMembers: number; // 현재 참여 인원 (승인된 인원 + 호스트)
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  schedule: string; // 예: "매주 토요일 14:00 - 17:00"
  startDate: string;
  endDate?: string;
  isClosed: boolean; // 모집 마감 여부
  createdAt: string;
  participants: Participant[];
}

/** 스터디 참여자 타입 */
export interface Participant {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected'; // 대기중 / 승인됨 / 거절됨
  message: string; // 참여 신청 메시지
  appliedAt: string;
}

/** 채팅 메시지 타입 */
export interface ChatMessage {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

/** 스터디 카테고리 유니온 타입 */
export type StudyCategory = '개발' | '디자인' | '어학' | '취업' | '자격증' | '독서' | '운동' | '기타';

/** 전체 카테고리 목록 (Select 드롭다운에서 사용) */
export const STUDY_CATEGORIES: StudyCategory[] = ['개발', '디자인', '어학', '취업', '자격증', '독서', '운동', '기타'];

/** 자주 사용되는 인기 태그 목록 (태그 선택 UI에서 사용) */
export const POPULAR_TAGS = ['React', 'Next.js', 'TypeScript', 'Python', 'Java', 'Spring', 'Node.js', 'AI/ML', 'CS기초', '알고리즘', '토익', '토플', '코딩테스트', 'UI/UX', 'Figma', 'AWS'];
