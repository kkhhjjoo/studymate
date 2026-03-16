'use client';

import useBookmarkStore from '@/zustand/bookmarkStore';
import { Study } from '@/types/studies';
import { useRouter } from 'next/navigation';
import { differenceInDays } from 'date-fns';
import BookmarkButton from '@/app/components/BookmarkButton/BookmarkButton';

function formatRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const days = differenceInDays(new Date(), d);
  if (days === 0) return '오늘';
  if (days === 1) return '1일 전';
  if (days > 1 && days <= 365) return `${days}일 전`;
  if (days === -1) return '1일 후';
  if (days < -1 && days >= -365) return `${-days}일 후`;
  return '';
}

function BookmarkCard({ study }: { study: Study }) {
  const router = useRouter();
  const extra = study.extra;
  const maxMembers = extra?.maxMembers ?? 0;
  const currentMembers = extra?.participant?.length ?? 0;
  const isFull = maxMembers > 0 && currentMembers >= maxMembers;
  const isClosed = extra?.isClosed ?? false;
  const statusLabel = isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';
  const statusClass = isClosed ? 'bookmarkCardBadgeClosed' : isFull ? 'bookmarkCardBadgeFull' : 'bookmarkCardBadgeOpen';
  const tags = (extra?.tags ?? []).slice(0, 5);
  const hostName = extra?.hostName ?? study.seller?.name ?? '-';
  const relativeDate = formatRelativeDate(extra?.startDate);

  const studyId = study.id ?? study._id;
  return (
    <article
      className="bookmarkCardHorizontal"
      onClick={() => studyId != null && router.push(`/study/${studyId}`)}
      onKeyDown={(e) => e.key === 'Enter' && studyId != null && router.push(`/study/${studyId}`)}
      role="button"
      tabIndex={0}
    >
      <div className="bookmarkCardMain">
        <div className="bookmarkCardTop">
          <span className={`bookmarkCardBadge ${statusClass}`}>{statusLabel}</span>
          <h3 className="bookmarkCardTitle">{study.name}</h3>
        </div>
        {study.content && (
          <p className="bookmarkCardDescription">{study.content}</p>
        )}
        {tags.length > 0 && (
          <div className="bookmarkCardTags">
            {tags.map((tag) => (
              <span key={tag} className="bookmarkCardTag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="bookmarkCardFooter">
        <span className="bookmarkCardAuthor">
          {hostName}
          {relativeDate && <span className="bookmarkCardDate"> - {relativeDate}</span>}
        </span>
        <span className="bookmarkCardHeart" onClick={(e) => e.stopPropagation()}>
          {studyId != null && (
            <BookmarkButton studyId={studyId} study={study} width={18} height={18} />
          )}
          <span className="bookmarkCardHeartCount">0</span>
        </span>
      </div>
    </article>
  );
}

export default function BookmarkSection() {
  const { bookmarks, loading } = useBookmarkStore();

  return (
    <section>
      <h2 className="sectionTitle">북마크</h2>

      {loading ? (
        <p className="emptyText">북마크 불러오는 중...</p>
      ) : bookmarks.length === 0 ? (
        <div className="bookmarkEmptyBox">
          <p className="bookmarkEmptyText">저장한 북마크가 없습니다.</p>
        </div>
      ) : (
        <div className="bookmarkList">
          {bookmarks
            .filter((bookmark) => bookmark.product && bookmark.product.name)
            .map((bookmark) => (
              <BookmarkCard key={bookmark._id} study={bookmark.product} />
            ))}
        </div>
      )}
    </section>
  );
}
