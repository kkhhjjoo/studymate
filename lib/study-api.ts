import { API_URL, CLIENT_ID } from './user';
import type { Study } from './types';
import type { Product } from './types';

/** API 상품 응답 (서버는 _id 사용 가능) */
interface ApiProduct extends Product {
  _id?: number | string;
}

interface ProductsListResponse {
  ok?: number;
  item?: ApiProduct[];
  items?: ApiProduct[];
}

type CreateStudyInput = Omit<Study, 'id' | 'createdAt' | 'currentMembers' | 'participants'>;

interface CreateStudyResponse {
  ok?: number;
  item?: { _id?: number; id?: string };
  _id?: number | string;
  id?: string;
}

function studyToBody(study: Partial<CreateStudyInput> & Pick<CreateStudyInput, 'title'>) {
  return {
    name: study.title,
    content: study.description,
    price: 0,
    quantity: study.maxMembers,
    shippingFees: 0,
    show: study.isClosed !== undefined ? !study.isClosed : undefined,
    extra: {
      type: 'study',
      category: study.category,
      tags: study.tags,
      location: study.location,
      schedule: study.schedule,
      startDate: study.startDate,
      endDate: study.endDate ?? '',
      hostId: study.hostId,
      hostName: study.hostName,
      hostAvatar: study.hostAvatar ?? '',
      currentMembers: 1,
      participants: [],
    },
  };
}

/** API 상품 → Study 변환 (product DB에 있는 스터디만 표시용) */
function productToStudy(p: ApiProduct): Study {
  const id = String(p._id ?? p.id ?? '');
  const extra = (p.extra ?? {}) as {
    type?: string;
    category?: string;
    tags?: string[];
    location?: Study['location'];
    schedule?: string;
    startDate?: string;
    endDate?: string;
    hostId?: string;
    hostName?: string;
    hostAvatar?: string;
    currentMembers?: number;
    participants?: Study['participants'];
  };
  const raw = p as { user?: { name?: string; _id?: string }; seller?: { name?: string; _id?: string } };
  const hostName = extra.hostName ?? raw.user?.name ?? raw.seller?.name ?? '스터디장';
  const hostId = extra.hostId ?? raw.user?._id ?? raw.seller?._id ?? '';
  const location = extra.location ?? { name: '서울', lat: 37.5666805, lng: 126.9784147 };
  return {
    id,
    title: p.name ?? '',
    description: p.content ?? '',
    category: extra.category ?? '기타',
    tags: Array.isArray(extra.tags) ? extra.tags : [],
    maxMembers: p.quantity ?? 0,
    currentMembers: extra.currentMembers ?? 1,
    hostId: String(hostId),
    hostName,
    hostAvatar: extra.hostAvatar,
    location,
    schedule: extra.schedule ?? '',
    startDate: extra.startDate ?? '',
    endDate: extra.endDate,
    isClosed: p.show === false,
    createdAt: new Date().toISOString(),
    participants: Array.isArray(extra.participants) ? extra.participants : [],
  };
}

/** product DB 상품 목록 조회 (스터디 타입만 Study[]로 반환) */
export async function fetchProductsAPI(accessToken?: string): Promise<Study[]> {
  try {
    const headers: Record<string, string> = { 'Client-Id': CLIENT_ID };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    // 1) GET /sellers/products (판매자 상품 목록)
    let res = await fetch(`${API_URL}/sellers/products`, { method: 'GET', headers });
    if (!res.ok) {
      // 2) GET /products (공개 상품 목록) 폴백
      res = await fetch(`${API_URL}/products`, { method: 'GET', headers });
    }
    if (!res.ok) return [];

    const data = await res.json();
    const raw =
      (Array.isArray(data.item) ? data.item : null) ??
      (Array.isArray(data.items) ? data.items : null) ??
      (Array.isArray(data.data) ? data.data : null) ??
      (Array.isArray(data) ? data : null) ??
      (Array.isArray(data.item?.list) ? data.item.list : null) ??
      [];
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((p) => p && (p.name || p.content))
      .filter((p) => p.show !== false)
      .filter((p) => !(p.extra as { type?: string })?.type || (p.extra as { type?: string })?.type === 'study')
      .map(productToStudy);
  } catch {
    return [];
  }
}

/** 상품 단건 조회 후 Study로 변환 (상세/수정 페이지용) */
export async function fetchProductByIdAPI(productId: string, accessToken?: string): Promise<Study | null> {
  if (!productId) return null;
  try {
    const headers: Record<string, string> = { 'Client-Id': CLIENT_ID };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    // 1) GET /sellers/products/:id (판매자 상품 단건)
    let res = await fetch(`${API_URL}/sellers/products/${productId}`, { method: 'GET', headers });
    if (!res.ok) {
      // 2) GET /products/:id (공개 상품 단건) 폴백
      res = await fetch(`${API_URL}/products/${productId}`, { method: 'GET', headers });
    }
    if (!res.ok) return null;

    const data = await res.json();
    const p: ApiProduct | undefined =
      data.item ?? data.data ?? data.product ?? (data._id || data.id ? data : undefined);
    if (!p || (typeof p.name !== 'string' && typeof p.content !== 'string')) return null;
    return productToStudy(p);
  } catch {
    return null;
  }
}

export async function createStudyAPI(
  study: CreateStudyInput,
  accessToken: string,
): Promise<{ id: string } | null> {
  try {
    const res = await fetch(`${API_URL}/sellers/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(studyToBody(study)),
    });

    const data: CreateStudyResponse = (await res.json()) as CreateStudyResponse;
    if (!res.ok) return null;

    const rawId = data.item?._id ?? data.item?.id ?? data._id ?? data.id;
    const id = rawId != null ? String(rawId) : null;
    return id ? { id } : null;
  } catch {
    return null;
  }
}

export async function updateStudyAPI(
  id: string,
  study: Partial<CreateStudyInput>,
  accessToken: string,
): Promise<boolean> {
  const res = await fetch(`${API_URL}/sellers/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(studyToBody(study as CreateStudyInput)),
  });

  return res.ok;
}

export async function deleteStudyAPI(
  id: string,
  accessToken: string,
): Promise<boolean> {
  const res = await fetch(`${API_URL}/sellers/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Client-Id': CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.ok;
}
