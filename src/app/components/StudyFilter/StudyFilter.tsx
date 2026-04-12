'use client';

import { useState } from 'react';
import styles from './StudyFilter.module.css';
import { regionData } from '@/lib/regionData';

const STUDY_CATEGORIES = ['전체', '개발', '디자인', '어학', '취업', '자격증', '독서', '기타'];
const POPULAR_TAGS = ['React', 'Next.js', 'TypeScript', 'Python', 'Java', 'Spring', 'Node.js', 'AI/ML', 'CS기초', '알고리즘', '토익', '토플'];

interface StudyFilterProps {
  onFilterChanges: (key: string, value: string) => void;
  showCategory?: boolean;
  filterValues?: Record<string, string>;
}

export default function StudyFilter({ onFilterChanges, showCategory = true, filterValues = {} }: StudyFilterProps) {
  const [region, setRegion] = useState(filterValues.region ?? '');
  const [selectedTag, setSelectedTag] = useState(filterValues.tag ?? '');

  return (
    <>
      <div className={styles.root}>
        {showCategory && (
          <div className={`${styles.wrapper} ${styles.categoryDisplay}`}>
            <label htmlFor="filter-category" className={styles.srOnly}>
              카테고리
            </label>
            <select name="카테고리" id="filter-category" defaultValue="" onChange={(e) => onFilterChanges('category', e.target.value)}>
              <option value="">카테고리</option>
              {STUDY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`${styles.wrapper} ${styles.dateWrapper}`}>
          <span aria-hidden="true"></span>
          <input
            type="date"
            id="filter-date"
            className={styles.dateInput}
            min="2026-01-28"
            onChange={(e) => onFilterChanges('date', e.target.value)}
          />
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-gender" className={styles.srOnly}>
            성별
          </label>
          <select name="성별" id="filter-gender" defaultValue="" onChange={(e) => onFilterChanges('gender', e.target.value)}>
            <option value="">성별</option>
            <option value="남">남</option>
            <option value="여">여</option>
            <option value="남녀무관">남녀무관</option>
          </select>
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-age" className={styles.srOnly}>
            나이대
          </label>
          <select name="나이대" id="filter-age" defaultValue="" onChange={(e) => onFilterChanges('age', e.target.value)}>
            <option value="">나이대</option>
            <option value="10대">10대</option>
            <option value="20대">20대</option>
            <option value="30대">30대</option>
            <option value="40대 이상">40대 이상</option>
          </select>
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-region" className={styles.srOnly}>
            지역
          </label>
          <select
            name="지역"
            id="filter-region"
            onChange={(e) => {
              setRegion(e.target.value);
              onFilterChanges('region', e.target.value);
              onFilterChanges('district', '');
            }}
          >
            <option value="">지역</option>
            {Object.keys(regionData).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-district" className={styles.srOnly}>
            시/군/구
          </label>
          <select key={region} id="filter-district" disabled={!region} onChange={(e) => onFilterChanges('district', e.target.value)}>
            <option value="">{region ? '시/군/구' : '지역을 선택해주세요'}</option>
            {region &&
              regionData[region].map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
          </select>
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-quantity" className={styles.srOnly}>
            인원
          </label>
          <select name="인원" id="filter-quantity" defaultValue="" onChange={(e) => onFilterChanges('quantity', e.target.value)}>
            <option value="">인원</option>
            <option value="1 ~ 10명">1 ~ 10명</option>
            <option value="11 ~ 20명">11 ~ 20명</option>
            <option value="21 ~ 30명">21 ~ 30명</option>
            <option value="30명 이상">30명 이상</option>
          </select>
        </div>

        <div className={styles.wrapper}>
          <label htmlFor="filter-recruitment" className={styles.srOnly}>
            모집마감
          </label>
          <select name="모집마감" id="filter-recruitment" value={filterValues.recruitmentStatus ?? ''} onChange={(e) => onFilterChanges('recruitmentStatus', e.target.value)}>
            <option value="open">모집중</option>
            <option value="closed">모집마감</option>
          </select>
        </div>

        <div className={styles.wrapper}>
          <p className={styles.tagTitle}>인기 태그</p>
          <div className={styles.tagList}>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tagBtn} ${selectedTag === tag ? styles.tagBtnSelected : ''}`}
                onClick={() => {
                  const next = selectedTag === tag ? '' : tag;
                  setSelectedTag(next);
                  onFilterChanges('tag', next);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
