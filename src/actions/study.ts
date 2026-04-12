'use server';

import { ErrorRes, StudyInfoRes } from '@/types/api';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateStudyInput, createStudyAPI, updateStudyAPI, deleteStudyAPI } from '@/lib/study';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

export type ActionState = { ok: 0 | 1; message: string } | null;

// 모임 지원 (주문 생성)
export async function createApply(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;

  const accessToken = (formData.get('accessToken') as string | null) ?? '';
  const productsStr = formData.get('products') as string | null;
  const extraStr = formData.get('extra') as string | null;

  const body = {
    products: productsStr ? JSON.parse(productsStr) : undefined,
    extra: extraStr ? JSON.parse(extraStr) : undefined,
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': CLIENT_ID,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as StudyInfoRes | ErrorRes;

    if (data.ok) {
      updateTag('order');
      return { ok: 1, message: '신청이 완료되었습니다.' };
    }

    return { ok: 0, message: data.message ?? '신청에 실패했습니다.' };
  } catch (error) {
    console.error(error);
    return { ok: 0, message: '일시적인 네트워크 문제로 등록에 실패했습니다.' };
  }
}

// 모임 등록 (상품 생성)
export async function createStudy(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;

  const accessToken = (formData.get('accessToken') as string | null) ?? '';
  formData.delete('accessToken');

  const mainImagesStr = formData.get('mainImages') as string | null;
  const extraStr = formData.get('extra') as string | null;

  const input: CreateStudyInput = {
    price: Number(formData.get('price') ?? 0),
    shippingFees: Number(formData.get('shippingFees') ?? 0),
    name: String(formData.get('name') ?? ''),
    content: String(formData.get('content') ?? ''),
    quantity: Number(formData.get('quantity') ?? 0),
    mainImages: mainImagesStr ? JSON.parse(mainImagesStr) : undefined,
    extra: extraStr ? JSON.parse(extraStr) : undefined,
  };

  const result = await createStudyAPI(input, accessToken);

  if (!result) {
    return { ok: 0, message: '스터디 등록에 실패했습니다.' };
  }

  updateTag('products');
  updateTag('seller/products');
  redirect(`/study/${result.id}`);
}

// 스터디 수정
export async function updateStudy(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;

  const accessToken = (formData.get('accessToken') as string | null) ?? '';
  const _id = String(formData.get('_id') ?? '');
  formData.delete('accessToken');
  formData.delete('_id');

  const mainImagesStr = formData.get('mainImages') as string | null;
  const extraStr = formData.get('extra') as string | null;

  const input: Partial<CreateStudyInput> = {
    price: formData.get('price') != null ? Number(formData.get('price')) : undefined,
    shippingFees: formData.get('shippingFees') != null ? Number(formData.get('shippingFees')) : undefined,
    name: formData.get('name') != null ? String(formData.get('name')) : undefined,
    content: formData.get('content') != null ? String(formData.get('content')) : undefined,
    quantity: formData.get('quantity') != null ? Number(formData.get('quantity')) : undefined,
    mainImages: mainImagesStr ? JSON.parse(mainImagesStr) : undefined,
    extra: extraStr ? JSON.parse(extraStr) : undefined,
  };

  const ok = await updateStudyAPI(_id, input, accessToken);

  if (!ok) {
    return { ok: 0, message: '모임 수정에 실패했습니다.' };
  }

  updateTag('products');
  updateTag(`products/${_id}`);
  redirect(`/study/${_id}`);
}

// 스터디 삭제
export async function deleteStudy(prevState: ActionState, formData: FormData): Promise<ActionState> {
  void prevState;

  const accessToken = (formData.get('accessToken') as string | null) ?? '';
  const _id = String(formData.get('_id') ?? '');

  const ok = await deleteStudyAPI(_id, accessToken);

  if (!ok) {
    return { ok: 0, message: '모임 삭제에 실패했습니다.' };
  }

  updateTag('products');
  updateTag(`products/${_id}`);
  updateTag('seller/products');
  redirect(`/study`);
}

/** 클라이언트(상세 페이지)에서 호출: 서버에서 DELETE 실행 → CORS 없이 동일 API 호출 */
export async function deleteStudyProduct(accessToken: string, productId: string): Promise<ActionState> {
  const token = accessToken?.trim() ?? '';
  const id = productId?.trim() ?? '';
  if (!token || !id) {
    return { ok: 0, message: '로그인 또는 상품 정보가 없습니다.' };
  }

  const ok = await deleteStudyAPI(id, token);
  if (!ok) {
    return { ok: 0, message: '모임 삭제에 실패했습니다. 판매자 토큰과 상품 _id를 확인해주세요.' };
  }

  updateTag('products');
  updateTag(`products/${id}`);
  updateTag('seller/products');
  return { ok: 1, message: '스터디가 삭제되었습니다.' };
}

/**
 * 상품 buyQuantity 업데이트
 * @param {string} accessToken - 인증 토큰
 * @param {number} productId - 상품 ID
 * @param {number} buyQuantity - 업데이트할 buyQuantity 값
 * @returns {Promise<ActionState>} - 업데이트 결과 응답 객체
 */
export async function updateBuyQuantity(accessToken: string, productId: number, buyQuantity: number): Promise<ActionState> {
    try {
      const res = await fetch(`${API_URL}/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ buyQuantity }),
      });
  
      const data = await res.json();
      if (data.ok) {
        updateTag('products');
        updateTag(`products/${productId}`);
        return { ok: 1, message: 'buyQuantity 업데이트 완료' };
      }
      return { ok: 0, message: data.message || 'buyQuantity 업데이트 실패' };
    } catch (error) {
      console.error(error);
      return { ok: 0, message: '네트워크 오류로 buyQuantity 업데이트에 실패했습니다.' };
    }
  }
