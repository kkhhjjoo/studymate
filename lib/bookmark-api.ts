import { API_URL, CLIENT_ID } from './user';
import type { Study } from './types';
import { fetchProductByIdAPI } from './study-api';

/** 북마크 추가 POST /bookmarks/product */
export async function addBookmarkAPI(
  productId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ product: productId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 북마크 목록 조회 (GET /bookmarks 또는 /bookmarks/list) */
export async function fetchBookmarksAPI(accessToken: string): Promise<Study[]> {
  try {
    let res = await fetch(`${API_URL}/bookmarks`, {
      method: 'GET',
      headers: {
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      res = await fetch(`${API_URL}/bookmarks/list`, {
        method: 'GET',
        headers: {
          'Client-Id': CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.item ?? data.items ?? data.list ?? (Array.isArray(data) ? data : []);
    const rawList = Array.isArray(list) ? list : [];
    const productIds = rawList.map(
      (x: { productId?: string; product?: string; _id?: string }) =>
        x.productId ?? x.product ?? x._id
    ).filter(Boolean);
    const studies: Study[] = [];
    for (const id of productIds) {
      const study = await fetchProductByIdAPI(String(id), accessToken);
      if (study) studies.push(study);
    }
    return studies;
  } catch {
    return [];
  }
}
