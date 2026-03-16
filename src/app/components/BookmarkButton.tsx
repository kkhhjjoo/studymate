'use client';

import { useRouter } from 'next/navigation';
import useUserStore from '@/zustand/userStore';
import useBookmarkStore from '@/zustand/bookmarkStore';
import './BookmarkButton.css';
import { addBookmarks, deleteBookmark } from '@/actions/bookmarkAction';
import { FaRegHeart } from 'react-icons/fa';
import { FaHeart } from 'react-icons/fa';

interface BookmarkButtonProps {
  studyId: number;
  width?: number;
  height?: number;
  desktopWidth?: number;
  desktopHeight?: number;
}

export default function BookmarkButton({ studyId, width = 20, height = 20, desktopWidth, desktopHeight }: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const { isBookmarked, getBookmarkId, removeBookmark, hasHydrated } = useBookmarkStore();
  const accessToken = user?.token?.accessToken || '';
  const fetchBookmarks = useBookmarkStore((state) => state.fetchBookmarks);

  //hydration 완료 후에만 북마크 상태 확인 (hydration 에러 방지)
  const currentBookmark = hasHydrated ? isBookmarked(studyId) : false;

  //북마크 추가/제거 처리
  const handleClick = async (e: React.MouseEvent) => {
    //마우스 클릭 이벤트
    e.preventDefault();
    e.stopPropagation();

    if (!accessToken) {
      router.push('/login');
      return;
    }

    if (currentBookmark) {
      //제거
      const bookmarkId = getBookmarkId(studyId);
      if (bookmarkId) {
        const formData = new FormData();
        formData.append('accessToken', accessToken);
        formData.set('_id', String(bookmarkId));
        const result = await deleteBookmark(null, formData);
        if (!result) {
          removeBookmark(bookmarkId);
        }
      }
    } else {
      //추가
      const result = await addBookmarks(studyId, accessToken); //북마크 추가 api실행
      if (result) {
        await fetchBookmarks(accessToken); //추가할 때 북마크를 리패치
      }
    }
  };

  const cssVars = {
    '--bookmark-width': `${width}px`,
    '--bookmark-height': `${height}px`,
    '--bookmark-desktop-width': `${desktopWidth ?? width}px`,
    '--bookmark-desktop-height': `${desktopHeight ?? height}px`,
  } as React.CSSProperties;

  return (
    <button type="button" className="bookmark-btn" style={cssVars} onClick={handleClick} aria-label={currentBookmark ? '북마크 해제' : '북마크 추가'}>
      {currentBookmark ? <FaRegHeart /> : <FaHeart />}
    </button>
  );
}
