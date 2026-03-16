'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaPlus } from 'react-icons/fa6';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { IoSearchOutline } from 'react-icons/io5';
import useUserStore from '@/zustand/userStore';
import './Header.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { user, resetUser, hasHydrated } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };

  const initial = user?.name ? user.name.slice(0, 1) : '?';

  return (
    <header className="app-header">
      <div className="app-header-container">
        <Link href="/" className="app-header-brand">
          <div className="app-header-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 7v14"></path>
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <span>StudyMate</span>
        </Link>

        {onSearch && (
          <div className="app-header-search">
            <IoSearchOutline className="app-header-search-icon" />
            <input type="text" placeholder="스터디 검색..." className="app-header-search-input" onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}

        <div className="app-header-actions">
          {!hasHydrated ? (
            <div className="app-header-auth">
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </div>
          ) : user ? (
            <>
              <Link href="/create" className="app-header-btn-create">
                <FaPlus />
                스터디 만들기
              </Link>
              <button type="button" className="app-header-notification" aria-label="알림">
                <IoMdNotificationsOutline size={20} />
                <span className="app-header-notification-dot" aria-hidden="true" />
              </button>
              <Link href="/mypage" className="app-header-avatar" aria-label="마이페이지">
                {user.image ? <Image src={user.image} alt="" width={40} height={40} /> : <span>{initial}</span>}
              </Link>
              <button type="button" className="app-header-logout" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <div className="app-header-auth">
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
