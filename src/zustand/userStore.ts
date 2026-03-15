import { User } from '@/types/user';
import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

//로그인한 사용자 정보를 관리하는 스토어의 상태 인터페이스
interface UserStoreState {
  isLogin: boolean;
  user: User | null;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setUser: (user: User) => void;
  resetUser: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

//로그인한 사용자 정보를 관리하는 스토어 생성
//StateCreator: Zustand의 유틸리티 타입으로, set함수의 타입을 자동으로 추론해줌
//복잡한 타입 정의 없이도 set함수가 올바른 타입으로 인식됨
const UserStore: StateCreator<UserStoreState> = (set, get) => ({
  isLogin: false,
  user: null,
  hasHydrated: false,

  setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

  setUser: (user: User) =>
    set({
      user,
      isLogin: true,
    }),
  resetUser: () => set({ user: null, isLogin: false }),

  //리프레시 토큰으로 액세스 토큰 갱신
  refreshAccessToken: async () => {
    const { user } = get();

    if (!user?.token?.refreshToken) {
      console.log('리프레시 토큰이 없습니다.');
      return false;
    }
    //로그인을 했는지 안했는지 확인

    try {
      //GET 방식으로 변경! Header에 refreshToken 넣기
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token.refreshToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('토큰 갱신 실패');
      }

      const data = await res.json();
      //서버 응답 제이슨 객체로 변환

      //새 액세스 토큰으로 유저 정보 업데이트
      set({
        user: {
          ...user,
          token: {
            accessToken: data.accessToken || data.item?.token?.accessToken,
            refreshToken: user.token.refreshToken,
          },
        },
      });
      console.log('토큰 갱신 성공');
      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      get().resetUser();
      return false;
    }
  },
});

//SSR안전 localStorage래퍼
//서버 사이드 렌더링시 window가 없으므로 undefined 체크 후 접근한다.

const ssrSafeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

const useUserStore = create<UserStoreState>()(
  persist(UserStore, {
    name: 'user-storage',
    storage: createJSONStorage(() => ssrSafeStorage),
    onRehydrateStorage: () => (state) => {
      state?.setHasHydrated(true);
    },
  })
);

export default useUserStore;
