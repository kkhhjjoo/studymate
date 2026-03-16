/* 사용자 정보 인터페이스 */
export interface User {
  _id: number;
  email: string;
  name: string;
  type: string;
  age: number;
  region: string;
  image?: string;
  token?: {
    accessToken: string;
    refreshToken: string;
  };
}

/* 회원가입 폼 타입 */
export type SignUpForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  region: string;
  age: 'teen' | 'twenties' | 'thirties' | 'forties_plus';
  gender: 'm' | 'f';
};

/* 로그인 폼 타입 */
export type LoginForm = Pick<User, 'email'> & { password: string };

/* 사용자 상태 관리용 인터페이스 */
export interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  resetUser: () => void;
}
