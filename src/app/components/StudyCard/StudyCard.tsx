'use client';

import { useState } from 'react';
import './StudyCard.css';
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

export default function StudyCard({ study }: StudyCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const extra = study.extra;
  const maxMembers = extra?.maxMembers ?? 0;
  const currentMembers = extra?.participant?.length ?? 0;
  const isFull = maxMembers > 0 && currentMembers >= maxMembers;
  const isClosed = extra?.isClosed ?? false;

  const statusLabel = isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';
  const statusValue = isClosed ? 'badgeClosed' : isFull ? 'badgeFull' : 'badgeOpen';

  const startDate = extra?.startDate;
  const dateDisplay = extra?.schedule || (startDate && !Number.isNaN(new Date(startDate).getTime()) ? format(new Date(startDate), 'yyyy.MM.dd', { locale: ko }) : startDate) || '-';
  return (
    <div className="card" onClick={() => router.push(`/study/${study.id}`)}>
      {/* Header */}
      <div className="header">
        <div className="badges">
          <span className="badge" data-status={statusValue}>
            {statusLabel}
          </span>
          <span className="category">{extra?.category}</span>
        </div>
        <h3 className="title">{study.name}</h3>
      </div>

      {/* Content */}
      <div className="content">
        <p className="description">{study.content}</p>
        <div className="tags">
          {(extra?.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
          {(extra?.tags?.length ?? 0) > 3 && <span className="tag">+{(extra?.tags?.length ?? 0) - 3}</span>}
        </div>

        <div className="meta">
          <div className="metaItem">
            <span>
              <FaRegCalendarAlt />
            </span>
            <span>{dateDisplay}</span>
          </div>
          <div className="metaItem">
            <span>📍</span>
            <span>{extra?.location?.name}</span>
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="popoverWrap">
          <button
            className="hostBtn"
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen((v) => !v);
            }}
          >
            {extra?.hostName || '스터디장'}
          </button>
          {popoverOpen && (
            <div className="popover" onClick={(e) => e.stopPropagation()}>
              <button
                className="popoverItem"
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
                className="popoverItem"
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
        {/* 북마크 + 인원 */}
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          <div className="bookmarkBtnWrap">
            <BookmarkButton studyId={study.id} study={study} />
          </div>
          <div className="members">
            <span className={isFull ? 'membersFull' : ''}>
              {currentMembers}/{maxMembers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
