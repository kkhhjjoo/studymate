'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/zustand/userStore';
import useBookmarkStore from '@/zustand/bookmarkStore';
import styles from './BookmarkButton.module.css';
import { addBookmarks, deleteBookmark } from '@/actions/bookmarkAction';
import type { Bookmarks } from '@/types/bookmarks';
import type { Study } from '@/types/studies';
import { FaRegHeart, FaHeart } from 'react-icons/fa';

interface BookmarkButtonProps {
  studyId: number | string;
  study?: Study;
  width?: number;
  height?: number;
  desktopWidth?: number;
  desktopHeight?: number;
}

export default function BookmarkButton({ studyId, study, width = 20, height = 20, desktopWidth, desktopHeight }: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const isOn = useBookmarkStore((s) => {
    const id = Number(studyId);
    return s.bookmarks.some((b) => {
      if (Number(b.target_id) === id) return true;
      const p = b.product as { id?: number; _id?: number } | undefined;
      return p != null && Number(p.id ?? p._id) === id;
    });
  });
  const getBookmarkId = useBookmarkStore((s) => s.getBookmarkId);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const addBookmarkItem = useBookmarkStore((s) => s.addBookmarkItem);
  const replaceTempBookmark = useBookmarkStore((s) => s.replaceTempBookmark);
  const accessToken = user?.token?.accessToken || '';
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (pending) return;

    setPending(true);
    const sid = Number(studyId);

    if (isOn) {
      const bookmarkId = getBookmarkId(Number(studyId));
      if (bookmarkId != null) {
        const formData = new FormData();
        formData.append('accessToken', accessToken);
        formData.set('_id', String(bookmarkId));
        const result = await deleteBookmark(null, formData);
        if (result == null) removeBookmark(bookmarkId);
      }
    } else {
      const tempId = -Math.abs(sid);
      addBookmarkItem({
        _id: tempId,
        target_id: sid,
        type: 'study',
        user_id: 0,
        product: study ?? ({} as Bookmarks['product']),
      } as Bookmarks);
      const newBookmark = await addBookmarks(sid, accessToken);
      if (newBookmark) {
        const withProduct = study && !newBookmark.product ? { ...newBookmark, product: study } : newBookmark;
        replaceTempBookmark(sid, withProduct);
      } else {
        removeBookmark(tempId);
      }
    }

    setPending(false);
  };

  const cssVars = {
    '--bookmark-width': `${width}px`,
    '--bookmark-height': `${height}px`,
    '--bookmark-desktop-width': `${desktopWidth ?? width}px`,
    '--bookmark-desktop-height': `${desktopHeight ?? height}px`,
  } as React.CSSProperties;

  return (
    <button type="button" className={styles.bookmarkBtn} style={cssVars} onClick={handleClick} aria-label={isOn ? '북마크 해제' : '북마크 추가'}>
      {isOn ? <FaHeart className={styles.bookmarkOn} /> : <FaRegHeart className={styles.bookmarkOff} />}
    </button>
  );
}
