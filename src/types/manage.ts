import { Study } from '@/types/studies';

export interface Manage {
  _id: number; //주문아이디
  user_id: number; //상품을 주문한 사용자 아이디
  product_id: number; //상품 아이디
  quantity: number; //수량
  products: Study[]; //수량
  user: {
    name: string;
    image: string;
  };
}

/** GET /seller/orders 응답 행 (필드 누락·타입 변형 허용) */
export interface SellerOrderRow {
  _id?: number | string;
  user_id?: number | string;
  product_id?: number | string;
  quantity?: number;
  products?: Partial<Study>[];
  user?: { name?: string; image?: string };
  extra?: { message?: string; type?: string };
  createdAt?: string;
  created_at?: string;
}
