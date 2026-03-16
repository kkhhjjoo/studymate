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
  maxMembers: number;
  hostId: string;
  hostName: string;
  location: StudyLocation;
  schedule: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  participant: Participant[];
}

/** API Study를 UI 카드용 평탄화 데이터로 변환한 타입 */
export interface StudyCardData {
  id: number | string;
  title: string;
  hostId: string;
  hostName: string;
  category: string;
  maxMembers: number;
  currentMembers: number;
  isClosed: boolean;
  description?: string;
  startDate?: string;
  location?: StudyLocation;
  participants: { userId: string; status: 'pending' | 'approved' | 'rejected' }[];
}
