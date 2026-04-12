'use client';

import { useState } from 'react';
import styles from './StudyCard.module.css';
import { Study } from '@/types/studies';
import { FaRegCalendarAlt, FaUser } from 'react-icons/fa';
import { IoChatboxOutline } from 'react-icons/io5';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import BookmarkButton from '@/app/components/BookmarkButton/BookmarkButton';

interface StudyCardProps {
  study: Study;
  accessToken?: string;
}

type StatusBadgeKey = 'badgeOpen' | 'badgeFull' | 'badgeClosed';

export default function StudyCard({ study }: StudyCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const extra = study.extra;
  const maxMembers = study.quantity ?? extra?.maxMembers ?? 0;
  const currentMembers = study.buyQuantity ?? extra?.participant?.length ?? 0;
  const isFull = maxMembers > 0 && currentMembers >= maxMembers;
  const isClosed = extra?.isClosed ?? false;

  const statusLabel = isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';
  const statusValue: StatusBadgeKey = isClosed ? 'badgeClosed' : isFull ? 'badgeFull' : 'badgeOpen';

  const startDate = extra?.startDate;
  const dateDisplay =
    extra?.schedule ||
    (startDate && !Number.isNaN(new Date(startDate).getTime()) ? format(new Date(startDate), 'yyyy.MM.dd', { locale: ko }) : startDate) ||
    '-';

  const categoryLabel = extra?.category || (extra?.tags && extra.tags[0]) || '';
  const locationName = extra?.location?.name || '-';
  const tags = (extra?.tags && extra.tags.length > 0 ? extra.tags : extra?.category ? [extra.category] : []).slice(0, 3);
  const hostName = extra?.hostName ?? study.seller?.name ?? '스터디장';

  return (
    <div className={styles.card} onClick={() => router.push(`/study/${study.id}`)}>
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles[statusValue]}`}>{statusLabel}</span>
          {categoryLabel && <span className={styles.category}>{categoryLabel}</span>}
        </div>
        <h3 className={styles.title}>{study.name}</h3>
      </div>

      <div className={styles.content}>
        <p className={styles.description}>{study.content}</p>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
          {(extra?.tags?.length ?? 0) > 3 && <span className={styles.tag}>+{(extra?.tags?.length ?? 0) - 3}</span>}
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span>
              <FaRegCalendarAlt />
            </span>
            <span>{dateDisplay}</span>
          </div>
          <div className={styles.metaItem}>
            <span>📍</span>
            <span>{locationName}</span>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.popoverWrap}>
          <button
            type="button"
            className={styles.hostBtn}
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen((v) => !v);
            }}
          >
            {hostName}
          </button>
          {popoverOpen && (
            <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.popoverItem}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/study/${study.id}?tab=chat`);
                }}
              >
                <span>
                  <IoChatboxOutline />
                </span>
                채팅하기
              </button>
              <button
                type="button"
                className={styles.popoverItem}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${extra?.hostId}`);
                }}
              >
                <span>
                  <FaUser />
                </span>
                프로필 보기
              </button>
            </div>
          )}
        </div>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <div className={styles.members}>
            <span className={isFull ? styles.membersFull : styles.membersCount}>
              {currentMembers}/{maxMembers}
            </span>
          </div>
          <div className={styles.bookmarkBtnWrap}>
            <BookmarkButton studyId={study.id} study={study} />
          </div>
        </div>
      </div>
    </div>
  );
}
