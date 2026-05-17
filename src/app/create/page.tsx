'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { createStudyAPI } from '@/lib/study';
import styles from './Create.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SUGGESTED_TAGS = ['React', 'Next.js', 'TypeScript', 'Python', 'Java', 'Spring', 'Node.js', 'AI/ML', 'CS기초'];

export default function CreateStudyPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const accessToken = user?.token?.accessToken ?? '';

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);

  const addTagValue = (value: string) => {
    if (!value) return;
    if (tags.includes(value)) return;
    if (tags.length >= 5) return;
    setTags((prev) => [...prev, value]);
  };

  const handleAddTag = () => {
    const value = tagsInput.trim();
    if (!value) return;
    addTagValue(value);
    setTagsInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken || !user) {
      router.push('/login');
      return;
    }

    if (!name.trim()) { toast.error('스터디 제목을 입력해주세요.'); return; }
    if (!content.trim()) { toast.error('스터디 소개를 입력해주세요.'); return; }
    if (!quantity || Number(quantity) < 1) { toast.error('모집 인원을 1명 이상 입력해주세요.'); return; }

    setSaving(true);

    const extra = {
      hostId: String(user._id),
      hostName: user.name ?? '',
      category,
      tags,
      schedule,
      startDate,
      endDate,
      location: location.trim()
        ? { name: location.trim(), lat: 0, lng: 0 }
        : { name: '-', lat: 0, lng: 0 },
      age,
      gender,
      type: 'study' as const,
    };

    const result = await createStudyAPI(
      {
        name,
        content,
        quantity: Number(quantity),
        price: 0,
        shippingFees: 0,
        show: 'true',
        active: 'true',
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
              <input
                className={styles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: React 심화 스터디"
              />
            </label>

            <label className={styles.fieldLabel}>
              스터디 소개 *
              <textarea
                className={styles.fieldTextarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="스터디 목표, 진행 방식, 대상 등을 자세히 적어주세요."
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                카테고리 *
                <input
                  className={styles.fieldInput}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 개발, 디자인 등"
                />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                모집 인원 *
                <input
                  className={styles.fieldInput}
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
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
                <input
                  className={styles.fieldInput}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="직접 입력"
                />
                <button type="button" className={styles.btnOutline} onClick={handleAddTag}>
                  추가
                </button>
              </div>
              <div className={styles.tagList}>
                {tags.map((tag) => (
                  <button key={tag} type="button" className={styles.tagPill} onClick={() => handleRemoveTag(tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                나이 (예: 20대, 무관)
                <input
                  className={styles.fieldInput}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="예: 20대, 무관"
                />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                성별 (예: 무관, 여성, 남성)
                <input
                  className={styles.fieldInput}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="예: 무관"
                />
              </label>
            </div>

            <label className={styles.fieldLabel}>
              장소 *
              <input
                className={styles.fieldInput}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 역삼역 스터디룸"
              />
            </label>

            <label className={styles.fieldLabel}>
              일정 *
              <input
                className={styles.fieldInput}
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="예: 매주 토요일 14:00 - 17:00"
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                시작일 (선택)
                <input
                  className={styles.fieldInput}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className={`${styles.fieldLabel} ${styles.half}`}>
                종료일 (선택)
                <input
                  className={styles.fieldInput}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
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
