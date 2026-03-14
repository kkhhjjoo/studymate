import { create, StateCreator } from 'zustand';
import type { Study } from '@/lib/types';
import {
  addBookmarkAPI,
  fetchBookmarksAPI,
  fetchBookmarkByIdAPI,
  deleteBookmarkAPI,
} from '@/lib/bookmark-api';

interface BookmarkStoreState {
  bookmarks: Study[];
  isLoading: boolean;

  /** GET /bookmarks/product — 북마크 목록 불러오기 */
  fetchBookmarks: (accessToken: string) => Promise<void>;

  /** GET /bookmarks/product/:id — 특정 북마크 단건 조회 */
  fetchBookmarkById: (productId: string, accessToken: string) => Promise<Study | null>;

  /** POST /bookmarks/product — 북마크 추가 */
  addBookmark: (productId: string, study: Study, accessToken: string) => Promise<boolean>;

  /** DELETE /bookmarks/:id — 북마크 삭제 */
  removeBookmark: (bookmarkId: string, productId: string, accessToken: string) => Promise<boolean>;

  /** 특정 상품이 북마크됐는지 확인 */
  isBookmarked: (productId: string) => boolean;

  clearBookmarks: () => void;
}

const BookmarkStore: StateCreator<BookmarkStoreState> = (set, get) => ({
  bookmarks: [],
  isLoading: false,

  fetchBookmarks: async (accessToken) => {
    set({ isLoading: true });
    try {
      const studies = await fetchBookmarksAPI(accessToken);
      set({ bookmarks: studies });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBookmarkById: async (productId, accessToken) => {
    return fetchBookmarkByIdAPI(productId, accessToken);
  },

  addBookmark: async (productId, study, accessToken) => {
    const ok = await addBookmarkAPI(productId, accessToken);
    if (ok) {
      set((state) => ({
        bookmarks: state.bookmarks.some((b) => b.id === productId)
          ? state.bookmarks
          : [...state.bookmarks, study],
      }));
    }
    return ok;
  },

  removeBookmark: async (bookmarkId, productId, accessToken) => {
    const ok = await deleteBookmarkAPI(bookmarkId, accessToken);
    if (ok) {
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== productId),
      }));
    }
    return ok;
  },

  isBookmarked: (productId) => {
    return get().bookmarks.some((b) => b.id === productId);
  },

  clearBookmarks: () => set({ bookmarks: [] }),
});

const useBookmarkStore = create<BookmarkStoreState>()(BookmarkStore);

export default useBookmarkStore;
