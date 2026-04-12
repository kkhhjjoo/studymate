'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { createStudyAPI } from '@/lib/study';
import styles from './Create.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SUGGESTED_TAGS = ['React', 'Next.js', 'TypeScript', 'Python', 'Java', 'Spring', 'Node.js', 'AI/ML', 'CS기초'];

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

export default function CreateStudyPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
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
  const [saving, setSaving] = useState(false);

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
    if (!accessToken || !user) {
      router.push('/login');
      return;
    }
    setSaving(true);

    const quantity = Number(form.quantity) || 0;

    const extra = {
      hostId: String(user._id),
      hostName: user.name ?? '',
      category: form.category,
      tags: form.tags,
      schedule: form.schedule,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location.trim()
        ? { name: form.location.trim(), lat: 0, lng: 0 }
        : undefined,
      age: form.age,
      gender: form.gender,
      type: 'study' as const,
    };

    const result = await createStudyAPI(
      {
        name: form.name,
        content: form.content,
        quantity,
        price: 0,
        shippingFees: 0,
        extra,
      },
      accessToken
    );

    setSaving(false);

    if (!result) {
      toast.error('스터디 생성에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    toast.success('스터디가 생성되었습니다.');
    router.push(`/study/${result.id}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.main}>
        <ToastContainer />
        <h1 className={styles.studyTitle}>스터디 만들기</h1>

        <form onSubmit={handleSubmit} className={styles.createStudyForm}>
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
                <input className={styles.fieldInput} value={form.category} onChange={handleChange('category')} placeholder="예: 개발, 디자인 등" />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                모집 인원 *
                <input className={styles.fieldInput} type="number" min={1} value={form.quantity} onChange={handleChange('quantity')} />
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
              {saving ? '생성 중...' : '스터디 만들기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
