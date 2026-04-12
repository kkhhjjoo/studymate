export interface Study {
  id: number;
  seller_id?: string;
  _id?: number | string;
  price: number;
  quantity: number;
  name: string;
  content: string;
  buyQuantity: number;
  shippingFees?: number;
  image?: { path: string };
  mainImages: [{ path: string; name: string }];
  show?: boolean;
  extra?: StudyExtra;
  seller: {
    _id: number;
    name: string;
  };
}

export interface Participant {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  joinedAt: string;
}

export interface StudyLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface StudyExtra {
  type?: string;
  category: string;
  tags: string[];
  maxMembers?: number;
  hostId: string;
  hostName: string;
  location: StudyLocation;
  schedule: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  participant: Participant[];
  /** 폼/API에서 자유 입력으로 쓰는 필드 */
  age?: string;
  gender?: string;
}

/** API Study를 UI 카드용 평탄화 데이터로 변환한 타입 */
export interface StudyCardData {
  id: number | string;
  title: string;
  hostId: string;
  sellerId: string; // extra.hostId 없는 기존 스터디 대비 seller._id 직접 저장
  hostName: string;
  category: string;
  tags: string[];
  maxMembers: number;
  currentMembers: number;
  isClosed: boolean;
  description?: string;
  schedule: string;
  startDate?: string;
  endDate?: string;
  location: StudyLocation;
  participants: {
    id: string;
    userId: string;
    userName: string;
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    appliedAt: string;
  }[];
}
