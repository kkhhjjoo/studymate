'use client';

import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { getStudyDetail, updateStudyAPI, type CreateStudyInput } from '@/lib/study';
import type { ApiProduct } from '@/types/api';
import type { StudyExtra, StudyLocation } from '@/types/studies';
import styles from './Edit.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SUGGESTED_TAGS = ['React', 'Next.js', 'TypeScript', 'Python', 'Java', 'Spring', 'Node.js', 'AI/ML', 'CS기초'];

const STUDY_CATEGORIES = ['개발', '디자인', '어학', '취업', '자격증', '독서', '기타'];

const MEMBER_COUNT_OPTIONS = Array.from({ length: 50 }, (_, i) => String(i + 1));

/** `<input type="date">`는 `YYYY-MM-DD`만 반영됨 — API의 ISO·점 구분 문자열을 맞춤 */
function toDateInputValue(value: string | undefined | null): string {
  if (value == null || String(value).trim() === '') return '';
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const dot = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dot) {
    const [, y, mo, da] = dot;
    return `${y}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
  }
  return '';
}

function isStudyDetailSuccess(res: unknown): res is { ok: number | boolean; item: ApiProduct } {
  if (res == null || typeof res !== 'object') return false;
  const r = res as { ok?: unknown; item?: unknown };
  if (!('ok' in r) || r.ok === 0 || r.ok === false) return false;
  return r.item != null && typeof r.item === 'object';
}

interface FormState {
  name: string;
  content: string;
  category: string;
  quantity: string;
  tagsInput: string;
  tags: string[];
  location: string;
  schedule: string;
  startDate: string;
  endDate: string;
  age: string;
  gender: string;
}

export default function StudyEditPage() {
  const params = useParams<{ id: string }>();
  const rawParam = params?.id;
  const id = typeof rawParam === 'string' ? rawParam : Array.isArray(rawParam) ? (rawParam[0] ?? '') : '';
  const invalidRouteId = id === '' || id === 'undefined';
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const accessToken = user?.token?.accessToken ?? '';

  const [form, setForm] = useState<FormState>({
    name: '',
    content: '',
    category: '',
    quantity: '',
    tagsInput: '',
    tags: [],
    location: '',
    schedule: '',
    startDate: '',
    endDate: '',
    age: '',
    gender: '',
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  /** 저장 시 장소 좌표 유지용 (상세 로드 시점의 extra) */
  const loadedExtraRef = useRef<Partial<StudyExtra> | null>(null);

  useEffect(() => {
    if (!hasHydrated || invalidRouteId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const detail = await getStudyDetail(id, accessToken || undefined);
      if (cancelled) return;

      if (!isStudyDetailSuccess(detail)) {
        const msg =
          detail && typeof detail === 'object' && 'message' in detail && typeof (detail as { message?: string }).message === 'string'
            ? (detail as { message: string }).message
            : '스터디 정보를 불러오지 못했습니다.';
        setLoadError(msg);
        setLoading(false);
        return;
      }

      const p = detail.item;
      const extra: Partial<StudyExtra> = p.extra ?? {};
      loadedExtraRef.current = extra;
      setProductId(String(p._id ?? p.id ?? id));
      setForm((prev) => ({
        ...prev,
        name: p.name ?? '',
        content: p.content ?? '',
        category: extra.category ?? '',
        quantity: String(p.quantity ?? extra.maxMembers ?? 1),
        tags: Array.isArray(extra.tags) ? extra.tags : [],
        location: extra.location?.name ?? '',
        schedule: extra.schedule ?? '',
        startDate: toDateInputValue(extra.startDate),
        endDate: toDateInputValue(extra.endDate),
        age: extra.age ?? '',
        gender: extra.gender ?? '',
      }));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, hasHydrated, accessToken, invalidRouteId]);

  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addTagValue = (value: string) => {
    if (!value) return;
    if (form.tags.includes(value)) return;
    if (form.tags.length >= 5) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
  };

  const handleAddTag = () => {
    const value = form.tagsInput.trim();
    if (!value) return;
    addTagValue(value);
    setForm((prev) => ({ ...prev, tagsInput: '' }));
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      router.push('/login');
      return;
    }
    // productId가 없으면 URL 파라미터 id를 최종 fallback으로 사용
    const targetId = productId ?? String(id);
    setSaving(true);
    const quantity = Number(form.quantity) || 0;
    const prev = loadedExtraRef.current;
    const locationPatch: StudyLocation | undefined = form.location.trim()
      ? {
          name: form.location.trim(),
          lat: prev?.location?.lat ?? 0,
          lng: prev?.location?.lng ?? 0,
        }
      : undefined;

    const extraUpdate: Partial<StudyExtra> = {
      category: form.category,
      tags: form.tags,
      schedule: form.schedule,
      startDate: form.startDate,
      endDate: form.endDate,
      age: form.age,
      gender: form.gender,
      ...(locationPatch ? { location: locationPatch } : {}),
    };

    const payload: Partial<CreateStudyInput> = {
      name: form.name,
      content: form.content,
      quantity,
      extra: extraUpdate,
    };

    const ok = await updateStudyAPI(targetId, payload, accessToken);
    setSaving(false);
    if (ok) {
      toast.success('모임이 수정되었습니다.');
      router.push(`/study/${id}`);
    } else {
      toast.error('모임 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!hasHydrated) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingMessage}>불러오는 중...</p>
        </main>
      </div>
    );
  }

  if (invalidRouteId) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingMessage}>유효하지 않은 스터디 ID입니다.</p>
          <div className={styles.editActions}>
            <button type="button" className={styles.btnOutline} onClick={() => router.back()}>
              돌아가기
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => router.push('/')}>
              홈으로
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingMessage}>로딩 중...</p>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingMessage}>{loadError}</p>
          <div className={styles.editActions}>
            <button type="button" className={styles.btnOutline} onClick={() => router.back()}>
              돌아가기
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => router.push(`/study/${id}`)}>
              상세 보기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.main}>
        <ToastContainer />
        <button type="button" className={styles.backButton} onClick={() => router.back()}>
          돌아가기
        </button>
        <h1 className={styles.studyTitle}>스터디 수정</h1>
        <p className={styles.studySubtitle}>스터디 정보를 수정하세요.</p>

        <form onSubmit={handleSubmit} className={styles.editStudyForm}>
          <section className={styles.editSection}>
            <label className={styles.fieldLabel}>
              스터디 제목 *
              <input className={styles.fieldInput} value={form.name} onChange={handleChange('name')} placeholder="예: React 심화 스터디" />
            </label>

            <label className={styles.fieldLabel}>
              스터디 소개 *
              <textarea className={styles.fieldTextarea} value={form.content} onChange={handleChange('content')} placeholder="스터디 목표, 진행 방식, 대상 등을 자세히 적어주세요." />
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                카테고리 *
                <select className={styles.fieldSelect} value={form.category} onChange={handleChange('category')}>
                  <option value="">카테고리 선택</option>
                  {form.category && !STUDY_CATEGORIES.includes(form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                  {STUDY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                모집 인원 *
                <select className={styles.fieldSelect} value={form.quantity} onChange={handleChange('quantity')}>
                  <option value="">인원 선택</option>
                  {form.quantity && !MEMBER_COUNT_OPTIONS.includes(form.quantity) && (
                    <option value={form.quantity}>{form.quantity}명 (현재)</option>
                  )}
                  {MEMBER_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.fieldLabel}>
              태그 (최대 5개)
              <div className={`${styles.tagList} ${styles.tagListSpacing}`}>
                {SUGGESTED_TAGS.map((tag) => (
                  <button key={tag} type="button" className={styles.tagPill} onClick={() => addTagValue(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
              <div className={styles.tagInputRow}>
                <input className={styles.fieldInput} value={form.tagsInput} onChange={handleChange('tagsInput')} placeholder="직접 입력" />
                <button type="button" className={styles.btnOutline} onClick={handleAddTag}>
                  추가
                </button>
              </div>
              <div className={styles.tagList}>
                {form.tags.map((tag) => (
                  <button key={tag} type="button" className={styles.tagPill} onClick={() => handleRemoveTag(tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                나이 (예: 20대, 무관)
                <input className={styles.fieldInput} value={form.age} onChange={handleChange('age')} placeholder="예: 20대, 무관" />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                성별 (예: 무관, 여성, 남성)
                <input className={styles.fieldInput} value={form.gender} onChange={handleChange('gender')} placeholder="예: 무관" />
              </label>
            </div>

            <label className={styles.fieldLabel}>
              장소 *
              <input className={styles.fieldInput} value={form.location} onChange={handleChange('location')} placeholder="예: 역삼역 스터디룸" />
            </label>

            <label className={styles.fieldLabel}>
              일정 *
              <input className={styles.fieldInput} value={form.schedule} onChange={handleChange('schedule')} placeholder="예: 매주 토요일 14:00 - 17:00" />
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                시작일 (선택)
                <input className={styles.fieldInput} type="date" value={form.startDate} onChange={handleChange('startDate')} />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                종료일 (선택)
                <input className={styles.fieldInput} type="date" value={form.endDate} onChange={handleChange('endDate')} />
              </label>
            </div>
          </section>

          <div className={styles.editActions}>
            <button type="button" className={styles.btnOutline} onClick={() => router.back()}>
              취소
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
