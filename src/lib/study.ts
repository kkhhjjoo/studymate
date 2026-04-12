import { Participant, Study, StudyCardData, StudyExtra } from '@/types/studies';
import { ApiProduct, CreateStudyRes, ErrorRes, StudyInfoRes, StudyListRes } from '@/types/api';
import type { SellerOrderRow } from '@/types/manage';

// 서버: 외부 API 직접 호출 / 클라이언트: CORS 우회를 위해 Next.js 프록시 경유
const API_URL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL
    : '/api/proxy';
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
  /** PATCH 전용: 승인 시 참여 인원 반영 */
  buyQuantity?: number;
  /** FESP 상품 노출·판매 플래그 (등록 샘플은 문자열 "true") */
  show?: boolean | string;
  active?: boolean | string;
}

function productToStudy(p: ApiProduct): Study {
  const { _id, ...rest } = p;
  const id = Number((rest as { id?: number }).id ?? _id) || 0;
  return { ...rest, id, seller_id: _id != null ? String(_id) : undefined };
}

function studyToBody(study: CreateStudyInput): Record<string, unknown> {
  return {
    price: study.price,
    quantity: study.quantity,
    name: study.name,
    content: study.content,
    ...(study.shippingFees != null && { shippingFees: study.shippingFees }),
    ...(study.mainImages != null && { mainImages: study.mainImages }),
    ...(study.buyQuantity != null && { buyQuantity: study.buyQuantity }),
    ...(study.show !== undefined && study.show !== null && { show: study.show }),
    ...(study.active !== undefined && study.active !== null && { active: study.active }),
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
 * @param _id - 스터디(상품) ID
 * @param accessToken - 있으면 Authorization 헤더로 전달 (비공개/판매자 전용 상품 조회에 필요할 수 있음)
 */
export async function getStudyDetail(
  _id: string | number | undefined | null,
  accessToken?: string | null
): Promise<StudyInfoRes | ErrorRes> {
  if (_id == null || _id === '' || _id === 'undefined') {
    return {
      ok: 0,
      message: '유효하지 않은 스터디 ID입니다.',
    };
  }
  try {
    const headers: Record<string, string> = {
      'Client-Id': CLIENT_ID,
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const res = await fetch(`${API_URL}/products/${_id}`, {
      headers,
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
    // buyQuantity 미전송 시 API 기본값이 1이 되는 경우가 있어, 신규 스터디는 현재 인원 0부터 시작
    const studyForBody: CreateStudyInput = {
      ...study,
      buyQuantity: study.buyQuantity ?? 0,
    };
    const res = await fetch(`${API_URL}/seller/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(studyToBody(studyForBody)),
    });
    const data = (await res.json()) as { ok?: 0 | 1; item?: { _id?: number | string }; message?: string };
    if (data?.ok === 0 || !res.ok) return null;
    const id = parseCreatedId(data);
    return id ? { id } : null;
  } catch {
    return null;
  }
}

async function evaluateJsonOkResponse(res: Response): Promise<boolean> {
  if (!res.ok) return false;
  const raw = await res.text();
  if (!raw.trim()) return true;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const ok = data.ok;
    if (ok === 0 || ok === false || ok === '0') return false;
    return true;
  } catch {
    return true;
  }
}

/** 참여 승인 등 일부 필드만 갱신할 때 사용 (name/content 등을 건드리지 않음) */
async function patchSellerProductFields(id: string, accessToken: string, body: Record<string, unknown>): Promise<boolean> {
  if (!API_URL || !accessToken) return false;
  const pathId = encodeURIComponent(String(id).trim());
  try {
    const res = await fetch(`${API_URL}/seller/products/${pathId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    return evaluateJsonOkResponse(res);
  } catch {
    return false;
  }
}

/**
 * 상품 수정: PATCH /seller/products/{_id}
 * (동일 경로에 PUT이 없으면 404가 나는 경우가 많아 PATCH 사용 — FESP seller PATCH와 동일)
 */
export async function updateStudyAPI(id: string, study: Partial<CreateStudyInput>, accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  const pathId = encodeURIComponent(String(id).trim());
  try {
    const res = await fetch(`${API_URL}/seller/products/${pathId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(studyToBody(study as CreateStudyInput)),
    });
    return evaluateJsonOkResponse(res);
  } catch {
    return false;
  }
}

async function evaluateSellerDeleteResponse(res: Response): Promise<boolean> {
  if (!res.ok) return false;
  const raw = await res.text();
  if (!raw.trim()) return true;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const ok = data.ok;
    if (ok === 0 || ok === false || ok === '0') {
      console.error('스터디 삭제 실패:', data.message ?? data);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/** DB에 show/active가 반영되도록 상세 기준 전체 PATCH → 실패 시 최소 필드만 순차 시도 */
async function hideSellerProductFromCatalog(productId: string, accessToken: string): Promise<boolean> {
  const detail = await getStudyDetail(productId, accessToken);
  if ('ok' in detail && detail.ok === 1 && detail.item) {
    const item = detail.item as ApiProduct;
    const patchId = String(item._id ?? productId);
    const base: CreateStudyInput = {
      price: item.price,
      quantity: item.quantity,
      name: item.name,
      content: item.content,
      ...(item.shippingFees != null && { shippingFees: item.shippingFees }),
      ...(item.mainImages != null && { mainImages: item.mainImages as CreateStudyInput['mainImages'] }),
      extra: { ...(item.extra ?? {}), type: 'study' },
    };
    const fullAttempts: CreateStudyInput[] = [
      { ...base, show: false, active: false },
      { ...base, show: 'false', active: 'false' },
      { ...base, active: false },
      { ...base, active: 'false' },
    ];
    for (const input of fullAttempts) {
      if (await updateStudyAPI(patchId, input, accessToken)) return true;
    }
  }

  const minimalBodies: Record<string, unknown>[] = [
    { active: false },
    { active: 'false' },
    { show: false, active: false },
    { show: 'false', active: 'false' },
    { show: false },
    { show: 'false' },
  ];
  for (const body of minimalBodies) {
    if (await patchSellerProductFields(productId, accessToken, body)) return true;
  }
  return false;
}

/**
 * 상품 삭제: DELETE /seller/products/{_id} 후, 목록에서 빠지도록 PATCH로 숨김까지 시도
 * - 많은 FESP 배포는 DELETE가 문서를 지우지 않고 플래그만 바꾸거나 200만 줌 → DB에 행이 남을 수 있음
 * - `show`/`active` PATCH로 앱·GET /products 목록에서는 제외되게 함 (완전 hard delete는 API 서버 수정 필요)
 */
export async function deleteStudyAPI(id: string, accessToken: string): Promise<boolean> {
  if (!API_URL || !accessToken) return false;
  const rawId = String(id).trim();
  if (!rawId) return false;
  const enc = encodeURIComponent(rawId);

  const urlCandidates = [
    `${API_URL}/seller/products/${enc}`,
    `${API_URL}/seller/products/${enc}/`,
  ];
  if (/^[a-fA-F0-9]{24}$/.test(rawId)) {
    urlCandidates.push(`${API_URL}/seller/products/${rawId}`);
    urlCandidates.push(`${API_URL}/seller/products/${rawId}/`);
  }

  const headers: Record<string, string> = {
    'Client-Id': CLIENT_ID,
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  try {
    let deleteSucceeded = false;
    let lastStatus = 0;
    for (const url of urlCandidates) {
      const res = await fetch(url, { method: 'DELETE', headers });
      lastStatus = res.status;
      if (res.status === 404 || res.status === 405) continue;
      deleteSucceeded = await evaluateSellerDeleteResponse(res);
      break;
    }

    const hidden = await hideSellerProductFromCatalog(rawId, accessToken);

    if (deleteSucceeded || hidden) return true;

    console.error('스터디 삭제: DELETE·숨김 PATCH 모두 실패, 마지막 HTTP', lastStatus);
    return false;
  } catch (e) {
    console.error('스터디 삭제 요청 에러:', e);
    return false;
  }
}

function sellerOrderMatchesStudy(order: SellerOrderRow, studyId: string | number): boolean {
  const sid = String(studyId);
  if (order.product_id != null && String(order.product_id) === sid) return true;
  const prods = order.products;
  if (!Array.isArray(prods)) return false;
  return prods.some((p) => {
    const pid = p?._id ?? (p as { id?: number | string })?.id;
    return pid != null && String(pid) === sid;
  });
}

function sellerOrderToParticipant(order: SellerOrderRow): StudyCardData['participants'][number] {
  const oid = order._id ?? `${order.user_id}-${order.product_id}`;
  return {
    id: String(oid),
    userId: String(order.user_id ?? ''),
    userName: order.user?.name ?? '신청자',
    status: 'pending',
    message: order.extra?.message ?? '',
    appliedAt: order.createdAt ?? order.created_at ?? '',
  };
}

/**
 * 상품 extra.participant가 비어 있어도, 주문(POST /orders)으로 쌓인 신청을 관리 탭에 보이게 한다.
 */
export function mergeSellerOrdersIntoStudyCard(study: StudyCardData, orders: SellerOrderRow[]): StudyCardData {
  const seen = new Set(study.participants.map((p) => String(p.userId)));
  const additions: StudyCardData['participants'] = [];
  for (const o of orders) {
    if (!sellerOrderMatchesStudy(o, study.id)) continue;
    const uid = String(o.user_id ?? '');
    if (!uid) continue;
    if (seen.has(uid)) continue;
    seen.add(uid);
    additions.push(sellerOrderToParticipant(o));
  }
  if (additions.length === 0) return study;
  return { ...study, participants: [...study.participants, ...additions] };
}

/**
 * 내 상품에 달린 주문 목록 (판매자 토큰 필요). FESP: GET /seller/orders
 */
export async function fetchSellerOrders(accessToken: string): Promise<SellerOrderRow[]> {
  if (!API_URL || !accessToken) return [];
  try {
    const res = await fetch(`${API_URL}/seller/orders`, {
      headers: {
        'Client-Id': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      ok?: number;
      item?: SellerOrderRow[] | { list?: SellerOrderRow[] };
      items?: SellerOrderRow[];
    };
    if (data.ok === 0) return [];
    const raw = data.items ?? data.item;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'list' in raw && Array.isArray((raw as { list: SellerOrderRow[] }).list)) {
      return (raw as { list: SellerOrderRow[] }).list;
    }
    if (raw && typeof raw === 'object' && ('_id' in raw || 'user_id' in raw)) {
      return [raw as SellerOrderRow];
    }
    return [];
  } catch (e) {
    console.error('판매자 주문 목록 조회 실패:', e);
    return [];
  }
}

function participantStatusIsApproved(status: unknown): boolean {
  const v = String(status ?? '').toLowerCase();
  return v === 'approved' || v === 'approve';
}

/**
 * 스터디장이 참여 신청을 승인/거절할 때 상품 extra.participant와 buyQuantity를 갱신한다.
 * - 승인(아직 승인 상태 아님): buyQuantity +1
 * - 거절: buyQuantity -1 (0 미만은 되지 않음)
 * participantRowId: 주문 기반 목록이면 주문 _id, extra만 있으면 신청자 userId.
 */
export async function applyParticipantDecision(
  productId: string,
  accessToken: string,
  participantRowId: string,
  decision: 'approved' | 'rejected'
): Promise<{ ok: boolean; message?: string }> {
  if (!accessToken) return { ok: false, message: '로그인이 필요합니다.' };

  const detail = await getStudyDetail(productId, accessToken);
  if (!('ok' in detail) || detail.ok === 0 || !detail.item) {
    return { ok: false, message: '스터디 정보를 불러오지 못했습니다.' };
  }

  const item = detail.item as ApiProduct;
  const orders = await fetchSellerOrders(accessToken);
  const order = orders.find((o) => String(o._id) === String(participantRowId));
  const userId = order ? String(order.user_id ?? '') : participantRowId;
  if (!userId) return { ok: false, message: '신청 정보를 찾을 수 없습니다.' };

  const prevList: Participant[] = Array.isArray(item.extra?.participant) ? [...(item.extra!.participant as Participant[])] : [];
  const existingIdx = prevList.findIndex((p) => String(p.userId) === userId);
  const existing = existingIdx >= 0 ? prevList[existingIdx] : undefined;

  const status: Participant['status'] = decision;
  const userName = existing?.userName ?? order?.user?.name ?? '신청자';
  const joinedAt = existing?.joinedAt ?? order?.createdAt ?? order?.created_at ?? new Date().toISOString();

  const nextRow: Participant = {
    userId,
    userName,
    status,
    joinedAt,
  };

  const nextParticipants: Participant[] =
    existingIdx >= 0
      ? prevList.map((p, i) => (i === existingIdx ? { ...p, ...nextRow } : p))
      : [...prevList, nextRow];

  const wasPendingOrNew = existing == null || !participantStatusIsApproved(existing.status);

  const mergedExtra: Partial<StudyExtra> & { type?: string } = {
    ...(item.extra ?? {}),
    participant: nextParticipants,
    type: 'study',
  };

  const patchId = String(item._id ?? productId);
  // 전체 상품 필드를 PATCH하면 API가 name/content 등을 null로 돌려준 경우 목록에서 빠질 수 있음 → extra·buyQuantity만 전송
  const body: Record<string, unknown> = {
    extra: { ...mergedExtra, type: 'study' },
  };
  const qty = item.buyQuantity ?? 0;
  if (decision === 'approved' && wasPendingOrNew) {
    body.buyQuantity = qty + 1;
  } else if (decision === 'rejected') {
    body.buyQuantity = Math.max(0, qty - 1);
  }

  const ok = await patchSellerProductFields(patchId, accessToken, body);
  if (!ok) return { ok: false, message: '서버에 반영하지 못했습니다.' };
  return { ok: true };
}
