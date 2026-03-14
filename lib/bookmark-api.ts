import type { Study } from './types';
import { fetchProductByIdAPI } from './study-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? ''

interface BookmarkItem {
  _id: string;
  product: { _id?: string; id?: string } | string;
}

/** POST /bookmarks/product — 북마크 추가 */
export async function addBookmarkAPI(
  productId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ target_id: Number(productId) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** GET /bookmarks/product — 북마크 목록 조회 (Study[] 반환) */
export async function fetchBookmarksAPI(accessToken: string): Promise<Study[]> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const list: BookmarkItem[] =
      data.item ?? data.items ?? (Array.isArray(data) ? data : []);
    if (!Array.isArray(list)) return [];

    const studies: Study[] = [];
    for (const item of list) {
      const rawProduct = item.product;
      const productId =
        typeof rawProduct === 'string'
          ? rawProduct
          : String(rawProduct?._id ?? rawProduct?.id ?? '');
      if (!productId) continue;
      const study = await fetchProductByIdAPI(productId, accessToken);
      if (study) studies.push(study);
    }
    return studies;
  } catch {
    return [];
  }
}

/** GET /bookmarks/product/:id — 특정 북마크 단건 조회 */
export async function fetchBookmarkByIdAPI(
  productId: string,
  accessToken: string,
): Promise<Study | null> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/product/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.item ?? data;
    const rawProduct = item?.product;
    const resolvedId =
      typeof rawProduct === 'string'
        ? rawProduct
        : String(rawProduct?._id ?? rawProduct?.id ?? productId);

    return fetchProductByIdAPI(resolvedId, accessToken);
  } catch {
    return null;
  }
}

/** DELETE /bookmarks/:id — 북마크 삭제 */
export async function deleteBookmarkAPI(
  bookmarkId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
