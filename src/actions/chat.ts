import { ErrorRes, ServerValidationError } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

/**
 * API 호출 중 발생하는 에러를 커스텀하기 위한 클래스
 */
export class ApiError extends Error {
  status: number;
  errors?: { [fieldName: string]: ServerValidationError };

  constructor(message: string, status: number, errors?: { [fieldName: string]: ServerValidationError }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// fetch api의 두번째 인자인 options를 확장
interface ApiOptions extends RequestInit {
  accessToken?: string;
  params?: Record<string, string | number | boolean>;
}

/**
 * 공통 API 호출 함수
 */
export async function apiCall<T extends { ok: 1; item?: unknown }>(url: string, options: ApiOptions = {}): Promise<T['item']> {
  const { accessToken, ...restOptions } = options;

  const headers = new Headers(restOptions.headers);
  headers.set('client-id', CLIENT_ID);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    // url에 쿼리 파라미터가 있을 경우
    const queryParams = new URLSearchParams();
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
    }

    const queryString = queryParams.toString();
    const fullUrl = (url.startsWith('http') ? url : `${API_URL}${url}`) + (queryString ? `?${queryString}` : '');
    console.log(fullUrl);
    const res = await fetch(fullUrl, {
      ...restOptions,
      headers,
    });

    const data: T | ErrorRes = await res.json();

    if (!data.ok) {
      throw new ApiError(data.message, res.status, data.errors);
    }

    return data.item;
  } catch (error) {
    console.error('에러 발생', error);
    if (error instanceof ApiError) {
      throw error;
    }
    // 네트워크 장애 등 예기치 않은 에러
    throw new ApiError(error instanceof Error ? error.message : '일시적인 문제로 에러가 발생했습니다.', 500);
  }
}
