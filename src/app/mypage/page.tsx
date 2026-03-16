'use client';

import Header from '@/app/components/Header/Header';
import './Mypage.css';
import MyStudy from '@/app/components/studies/Study';
import BookmarkSection from './BookmarkSection';
import ParticipatedSection from './ParticipatedSection';
import { StudyCardData } from '@/types/studies';
import { fetchProductsAPI } from '@/lib/study';
import { Study } from '@/types/studies';
import useBookmarkStore from '@/zustand/bookmarkStore';
import useUserStore from '@/zustand/userStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaPen } from 'react-icons/fa';

function toStudyCardData(s: Study): StudyCardData {
  return {
    id: s.id,
    title: s.name,
    hostId: s.extra?.hostId ?? '',
    hostName: s.extra?.hostName ?? '',
    category: s.extra?.category ?? '',
    maxMembers: s.extra?.maxMembers ?? 0,
    currentMembers: 0,
    isClosed: s.extra?.isClosed ?? false,
    description: s.content,
    startDate: s.extra?.startDate,
    location: s.extra?.location,
    participants: s.extra?.participant?.map((p) => ({ userId: p.userId, status: p.status })) ?? [],
  };
}

function formatAge(age: number | undefined): string {
  if (age == null) return '무관';
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대+';
}

export default function MypagePage() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const { bookmarks, fetchBookmarks } = useBookmarkStore();

  const [studies, setStudies] = useState<StudyCardData[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmark' | 'manage' | 'participated' | null>(null);
  const [bio, setBio] = useState('안녕하세요! 잘 부탁드려요!');

  const accessToken = user?.token?.accessToken ?? '';

  const bookmarkCount = bookmarks.length;
  const completedCount = user
    ? studies.filter(
        (s) =>
          String(s.hostId) !== String(user._id) &&
          s.participants.some((p) => String(p.userId) === String(user._id) && p.status === 'approved')
      ).length
    : 0;

  useEffect(() => {
    fetchProductsAPI(accessToken || undefined).then((res) => {
      if (Array.isArray(res)) setStudies(res.map(toStudyCardData));
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchBookmarks(accessToken);
  }, [accessToken, fetchBookmarks]);

  if (!user) {
    return (
      <div className="mypage-container">
        <main className="mypage-main center">
          <p>
            마이페이지를 보려면 <Link href="/login">로그인</Link>
            해주세요.
          </p>
        </main>
      </div>
    );
  }

  const ageLabel = formatAge(user.age);
  const regionLabel = user.region || '-';

  const myAppliedStudies = studies.filter(
    (s) =>
      String(s.hostId) !== String(user._id) &&
      s.participants.some((p) => String(p.userId) === String(user._id))
  );

  return (
    <div className="mypageContainer">
      <Header />

      <main className="mypageMain">
        <h1 className="mypageTitle">마이 페이지</h1>

        {/* 프로필 카드 */}
        <div className="profileCard">
          <div className="profileWrapper">
            <div className="profileAvatar">
              {user.image ? (
                <Image src={user.image} alt={user.name} width={48} height={48} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>

            <div className="profileInfo">
              <h2>{user.name}</h2>
              <p className="profileEmail">{user.email}</p>
              <p className="profileMeta">{ageLabel} | {regionLabel}</p>
              <div className="profileBioWrapper">
                <button
                  type="button"
                  className="profileBioIcon"
                  onClick={() => router.push('/mypage/edit')}
                  aria-label="프로필 수정하기"
                >
                  <FaPen size={12} />
                </button>
                <textarea className="profileBio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="statsBox">
          <div className="statsItem">
            <p>관심 모임</p>
            <p className="statsNumber">{bookmarkCount}</p>
          </div>
          <div className="statsItem">
            <p>참여 완료</p>
            <p className="statsNumber">{completedCount}</p>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="tabButtons">
          <button className={`tabButton ${activeTab === 'bookmark' ? 'active' : ''}`} onClick={() => setActiveTab('bookmark')}>
            북마크
          </button>
          <button className={`tabButton ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
            관리하기
          </button>
          <button className={`tabButton ${activeTab === 'participated' ? 'active' : ''}`} onClick={() => setActiveTab('participated')}>
            참여 모임
          </button>
        </div>

        {/* 북마크 탭 */}
        {activeTab === 'bookmark' && <BookmarkSection />}

        {/* 관리하기 탭 */}
        {activeTab === 'manage' && <MyStudy studies={studies} hideHeader />}

        {/* 참여 모임 탭 */}
        {activeTab === 'participated' && (
          <ParticipatedSection studies={myAppliedStudies} userId={String(user._id)} />
        )}
      </main>
    </div>
  );
}
