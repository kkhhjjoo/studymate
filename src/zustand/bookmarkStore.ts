import { Bookmarks } from '@/types/bookmarks';
import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getUserBookmarksList } from '@/lib/bookmarkApi';

interface BookmarkStoreState {
  bookmarks: Bookmarks[];
  loading: boolean;
  hasHydrated: boolean;

  // 북마크 목록 설정
  setBookmarks: (bookmarks: Bookmarks[]) => void;

  // 북마크 추가 (로컬 상태)
  addBookmarkItem: (item: Bookmarks) => void;

  // target_id로 찾은 임시 북마크(_id < 0)를 실제 항목으로 교체
  replaceTempBookmark: (targetId: number, realItem: Bookmarks) => void;

  // 북마크 삭제 (로컬 상태)
  removeBookmark: (bookmarkId: number) => void;

  // 특정 상품이 북마크되어 있는지 확인
  isBookmarked: (targetId: number) => boolean;

  // 북마크 ID 조회 (삭제 시 필요)
  getBookmarkId: (targetId: number) => number | null;

  // 로딩 상태 설정
  setLoading: (loading: boolean) => void;

  // 스토어 초기화 (로그아웃 시)
  resetBookmark: () => void;

  // 북마크 데이터 가져오기 (로그인 시 및 추가할때)
  fetchBookmarks: (accessToken: string) => Promise<void>;

  // hydration 완료 설정
  setHasHydrated: (state: boolean) => void;
}

const BookmarkStore: StateCreator<BookmarkStoreState> = (set, get) => ({
  bookmarks: [],
  loading: false,
  hasHydrated: false,

  setBookmarks: (bookmarks) => set({ bookmarks }),

  setHasHydrated: (state) => set({ hasHydrated: state }),

  addBookmarkItem: (item) =>
    set((state) => ({ bookmarks: [...state.bookmarks, item] })),

  replaceTempBookmark: (targetId, realItem) =>
    set((state) => ({
      bookmarks: state.bookmarks.map((b) =>
        Number(b.target_id) === Number(targetId) && b._id < 0 ? realItem : b
      ),
    })),

  removeBookmark: (bookmarkId) =>
    set((state) => ({
      bookmarks: state.bookmarks.filter((bookmark) => bookmark._id !== bookmarkId),
    })),

  isBookmarked: (targetId) => {
    const id = Number(targetId);
    return get().bookmarks.some((b) => {
      if (Number(b.target_id) === id) return true;
      const p = b.product as { id?: number; _id?: number } | undefined;
      return p && (Number(p.id ?? p._id) === id);
    });
  },

  getBookmarkId: (targetId) => {
    const id = Number(targetId);
    const bookmark = get().bookmarks.find((b) => {
      if (Number(b.target_id) === id) return true;
      const p = b.product as { id?: number; _id?: number } | undefined;
      return p && (Number(p.id ?? p._id) === id);
    });
    return bookmark ? bookmark._id : null;
  },

  setLoading: (loading) => set({ loading }),

  resetBookmark: () => {
    // 이전 버전의 localStorage 데이터도 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bookmark-storage');
    }
    set({
      bookmarks: [],
      loading: false,
    });
  },

  fetchBookmarks: async (accessToken: string) => {
    console.log('fetchBookmarks 호출됨, token:', accessToken ? '있음' : '없음');
    set({ loading: true });
    try {
      const result = await getUserBookmarksList(accessToken);
      console.log('북마크 API 응답:', result);
      if (result.ok && 'item' in result) {
        console.log('북마크 저장:', result.item);
        set({ bookmarks: result.item });
      }
    } catch (error) {
      console.error('북마크 fetch 에러:', error);
    } finally {
      set({ loading: false });
    }
  },
});

const useBookmarkStore = create<BookmarkStoreState>()(
  persist(BookmarkStore, {
    name: 'bookmark-storage',
    storage: createJSONStorage(() => localStorage),
    onRehydrateStorage: () => (state) => {
      state?.setHasHydrated(true);
    },
  })
);

export default useBookmarkStore;
