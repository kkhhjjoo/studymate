import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaPlus } from 'react-icons/fa6';
import { FiMessageCircle } from 'react-icons/fi';
import useUserStore from '@/zustand/userStore';

const Header = () => {
  const { user, resetUser, hasHydrated } = useUserStore();
  const router = useRouter();
  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };
  return (
    <header>
      <div className="container">
        <Link href="/">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 7v14"></path>
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <span>StudyMate</span>
        </Link>
        <nav className="nav">
          <Link href="/">스터디 찾기</Link>
          <Link href="/my-studies">내 스터디</Link>
        </nav>

        <div>
          {!hasHydrated ? (
            <>
              <button>
                <Link href="/login">로그인</Link>
              </button>
              <button>
                <Link href="/signup">회원가입</Link>
              </button>
            </>
          ) : user ? (
            <>
              <button>
                <Link href="/create">
                  <FaPlus />
                  스터디 만들기
                </Link>
              </button>
              <button>
                <Link href="/chat">
                  <FiMessageCircle />
                </Link>
              </button>
              <Link href="/mypage">
                <Image src="/default-image.jpg" alt="프로필" />
              </Link>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button>
                <Link href="/login">로그인</Link>
              </button>
              <button>
                <Link href="/signup">회원가입</Link>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
