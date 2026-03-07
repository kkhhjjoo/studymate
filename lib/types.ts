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

export interface Study {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  maxMembers: number;
  currentMembers: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  schedule: string;
  startDate: string;
  endDate?: string;
  isClosed: boolean;
  createdAt: string;
  participants: Participant[];
}

export interface Participant {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  appliedAt: string;
}

export interface ChatMessage {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export type StudyCategory =
  | '개발'
  | '디자인'
  | '어학'
  | '취업'
  | '자격증'
  | '독서'
  | '운동'
  | '기타';

export const STUDY_CATEGORIES: StudyCategory[] = [
  '개발',
  '디자인',
  '어학',
  '취업',
  '자격증',
  '독서',
  '운동',
  '기타',
];

export const POPULAR_TAGS = [
  'React',
  'Next.js',
  'TypeScript',
  'Python',
  'Java',
  'Spring',
  'Node.js',
  'AI/ML',
  'CS기초',
  '알고리즘',
  '토익',
  '토플',
  '코딩테스트',
  'UI/UX',
  'Figma',
  'AWS',
];
