'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa6';
import { IoChatbubbleOutline } from 'react-icons/io5';
import { IoSearchOutline } from 'react-icons/io5';
import { useState } from 'react';
import useUserStore from '@/zustand/userStore';
import styles from './Header.module.css';

const DEFAULT_AVATAR_PATH = '/default-image.jpg';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { user, resetUser, hasHydrated } = useUserStore();
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const avatarSrc = user?.image?.trim() || DEFAULT_AVATAR_PATH;
  const isExternalAvatar = avatarSrc.startsWith('http') || avatarSrc.startsWith('data:');

  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };

  const initial = user?.name ? user.name.slice(0, 1) : '?';

  return (
    <header className={styles.appHeader}>
      <div className={styles.appHeaderContainer}>
        <Link href="/" className={styles.appHeaderBrand}>
          <div className={styles.appHeaderLogo}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 7v14"></path>
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <span>StudyMate</span>
        </Link>

        {onSearch && (
          <div className={styles.appHeaderSearch}>
            <IoSearchOutline className={styles.appHeaderSearchIcon} />
            <input type="text" placeholder="스터디 검색..." className={styles.appHeaderSearchInput} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}

        <div className={styles.appHeaderActions}>
          {!hasHydrated ? (
            <div className={styles.appHeaderAuth}>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </div>
          ) : user ? (
            <>
              <Link href="/create" className={styles.appHeaderBtnCreate}>
                <FaPlus />
                스터디 만들기
              </Link>
              <button type="button" className={styles.appHeaderNotification} aria-label="알림">
                <IoChatbubbleOutline size={20} />
                <span className={styles.appHeaderNotificationDot} aria-hidden="true" />
              </button>
              <Link href="/mypage" className={styles.appHeaderAvatar} aria-label="마이페이지" key={user?._id ?? 'default'}>
                {avatarError ? (
                  <span className={styles.appHeaderAvatarInitial}>{initial}</span>
                ) : isExternalAvatar ? (
                  <Image
                    src={avatarSrc}
                    alt="프로필"
                    width={40}
                    height={40}
                    unoptimized
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Image src={DEFAULT_AVATAR_PATH} alt="기본 프로필" width={40} height={40} unoptimized onError={() => setAvatarError(true)} />
                )}
              </Link>
              <button type="button" className={styles.appHeaderLogout} onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <div className={styles.appHeaderAuth}>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
