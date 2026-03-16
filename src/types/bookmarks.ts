import { Study } from '@/types/studies';

export interface Bookmarks {
  type: string;
  user_id: number;
  target_id: number;
  product: Study;
  _id: number;
}
