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
