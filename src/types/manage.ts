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
