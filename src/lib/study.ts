import { Study, StudyExtra } from '@/types/studies';
import { ApiProduct, CreateStudyRes, ErrorRes, StudyInfoRes, StudyListRes } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

/** 스터디 생성/수정 시 사용하는 입력 타입 */
export interface CreateStudyInput {
  price: number;
  quantity: number;
  name: string;
  content: string;
  shippingFees?: number;
  mainImages?: string[] | { path: string; name?: string }[];
  extra?: Partial<StudyExtra> & { type?: string };
}

function productToStudy(p: ApiProduct): Study {
  const { _id, ...rest } = p;
  return { ...rest, seller_id: _id != null ? String(_id) : undefined };
}

function studyToBody(study: CreateStudyInput): Record<string, unknown> {
  return {
    price: study.price,
    quantity: study.quantity,
    name: study.name,
    content: study.content,
    ...(study.shippingFees != null && { shippingFees: study.shippingFees }),
    ...(study.mainImages != null && { mainImages: study.mainImages }),
    ...(study.extra != null && { extra: { ...study.extra, type: 'study' } }),
  };
}

function parseCreatedId(data: CreateStudyRes | (Record<string, unknown> & { item?: { _id?: number | string } })): string | null {
  const item = data?.item as { _id?: number | string } | undefined;
  if (item?._id == null) return null;
  return String(item._id);
}

/**
 * 스터디 타입 상품 목록 조회 (Study[]로 변환)
 * @param {string} [accessToken] - 인증 토큰 (선택, 판매자 상품 포함 시 사용)
 * @returns {Promise<Study[] | ErrorRes>} - 스터디 목록 또는 에러 응답 객체
 */
export async function fetchProductsAPI(accessToken?: string): Promise<Study[] | ErrorRes> {
  try {
    const headers: Record<string, string> = {
      'Client-Id': CLIENT_ID,
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const url = `${API_URL}/products`;
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    const data = (await res.json()) as Omit<StudyListRes, 'ok'> & {
      ok: number;
      item?: ApiProduct[] | { list?: ApiProduct[] };
      data?: ApiProduct[];
    };

    if (data.ok === 0) {
      return { ok: 0, message: '스터디 목록 조회에 실패했습니다.' };
    }

    type ItemShape = ApiProduct[] | { list?: ApiProduct[] };
    const rawItem: ItemShape | undefined = data.item as ItemShape | undefined;
    const list: ApiProduct[] = data.items ?? (Array.isArray(rawItem) ? rawItem : rawItem?.list) ?? data.data ?? [];

    const studies = list.filter((p) => (p.name || p.content) && p.show !== false && (!p.extra?.type || p.extra.type === 'study')).map(productToStudy);

    return studies;
  } catch (error) {
    console.error(error);
    return {
      ok: 0,
      message: '일시적인 네트워크 문제로 스터디 목록 조회에 실패했습니다.',
    };
  }
}

/**
 * 특정 스터디 상세 정보 조회
 * @param {string} _id - 스터디(상품) ID
 * @returns {Promise<StudyInfoRes | ErrorRes>} - 스터디 상세 응답 객체
 */
export async function getStudyDetail(_id: string | number): Promise<StudyInfoRes | ErrorRes> {
  try {
    const res = await fetch(`${API_URL}/products/${_id}`, {
      headers: {
        'Client-Id': CLIENT_ID,
      },
      cache: 'no-store',
      next: {
        tags: [`products/${_id}`],
      },
    });
    return res.json();
  } catch (error) {
    console.error(error);
    return {
      ok: 0,
      message: '일시적인 네트워크 문제로 스터디 상세 조회에 실패했습니다.',
    };
  }
}

/**
 * 사용자가 등록한 스터디 목록 조회
 * @param {string} accessToken - 인증 토큰
 * @returns {Promise<ProductListResponse | ErrorRes>} - 스터디 목록 응답 객체
 */
export async function getMyStudies(accessToken: string): Promise<StudyListRes | ErrorRes> {
  try {
    const res = await fetch(`${API_URL}/seller/products`, {
      headers: {
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    return res.json();
  } catch (error) {
    console.error(error);
    return {
      ok: 0,
      message: '일시적인 네트워크 문제로 내 스터디 목록 조회에 실패했습니다.',
    };
  }
}

/** 상품 등록: POST /seller/products/ */
export async function createStudyAPI(study: CreateStudyInput, accessToken: string): Promise<{ id: string } | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${API_URL}/seller/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(studyToBody(study)),
    });
    const data = (await res.json()) as { ok?: 0 | 1; item?: { _id?: number | string }; message?: string };
    if (data?.ok === 0 || !res.ok) return null;
    const id = parseCreatedId(data);
    return id ? { id } : null;
  } catch {
    return null;
  }
}

/** 상품 수정: PATCH /seller/products/{_id} (경로의 _id는 상품 식별자) */
export async function updateStudyAPI(id: string, study: Partial<CreateStudyInput>, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch(`${API_URL}/seller/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(studyToBody(study as CreateStudyInput)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 상품 삭제: DELETE /seller/products/{id} */
export async function deleteStudyAPI(id: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/seller/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
