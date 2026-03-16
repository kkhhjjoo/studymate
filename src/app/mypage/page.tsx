'use client';

import Header from '@/app/components/Header/Header';
import './Mypage.css';
import MyStudy from '@/app/components/studies/Study';
import { getUserBookmarksList } from '@/lib/bookmarkApi';
import { fetchProductsAPI } from '@/lib/study';
import { Bookmarks } from '@/types/bookmarks';
import { Study } from '@/types/studies';
import useUserStore from '@/zustand/userStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowRight, FaBookmark, FaCalendar, FaChevronDown, FaMapMarkerAlt, FaUser, FaUsers } from 'react-icons/fa';

interface StudyCardData {
  id: number | string;
  title: string;
  hostId: string;
  hostName: string;
  category: string;
  maxMembers: number;
  currentMembers: number;
  isClosed: boolean;
  description?: string;
  startDate?: string;
  location?: { name: string; lat: number; lng: number };
  participants: { userId: string; status: 'pending' | 'approved' | 'rejected' }[];
}

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

  const [studies, setStudies] = useState<StudyCardData[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmarks[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmark' | 'manage' | 'participated' | null>(null);
  const [bio, setBio] = useState('안녕하세요! 잘 부탁드려요!');

  const accessToken = user?.token?.accessToken ?? '';

  const bookmarkCount = bookmarks.length;

  const completedCount = user ? studies.filter((s) => String(s.hostId) !== String(user._id) && s.participants.some((p) => String(p.userId) === String(user._id) && p.status === 'approved')).length : 0;

  useEffect(() => {
    fetchProductsAPI(accessToken || undefined).then((res) => {
      if (Array.isArray(res)) setStudies(res.map(toStudyCardData));
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    async function load() {
      setBookmarkLoading(true);
      const res = await getUserBookmarksList(accessToken);
      if (active) {
        if ('item' in res && Array.isArray(res.item)) setBookmarks(res.item);
        setBookmarkLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [accessToken]);

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

  const myAppliedStudies = studies.filter((s) => String(s.hostId) !== String(user._id) && s.participants.some((p) => String(p.userId) === String(user._id)));

  return (
    <div className="mypageContainer">
      <Header />

      <main className="mypageMain">
        <h1 className="mypageTitle">마이 페이지</h1>

        {/* 프로필 카드 */}
        <div className="profileCard">
          <div className="profileWrapper">
            <div className="profileAvatar">{user.image ? <Image src={user.image} alt={user.name} width={48} height={48} /> : <span>{user.name.charAt(0)}</span>}</div>

            <div className="profileInfo">
              <h2>{user.name}</h2>
              <p className="profileEmail">{user.email}</p>
              <p className="profileMeta">
                {ageLabel} | {regionLabel}
              </p>
              <textarea className="profileBio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
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

        {/* 북마크 */}
        {activeTab === 'bookmark' && (
          <section>
            <h2 className="sectionTitle">북마크</h2>

            {bookmarkLoading ? (
              <p className="emptyText">북마크 불러오는 중...</p>
            ) : bookmarks.length === 0 ? (
              <p className="emptyText">저장한 북마크가 없습니다.</p>
            ) : (
              <div className="bookmarkList">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark._id} study={bookmark.product} />
                ))}
              </div>
            )}
          </section>
        )}

        <MyStudy studies={studies} hideHeader />

        {/* 신청 스터디 */}
        {activeTab === 'participated' && (
          <section>
            <h2 className="sectionTitle">신청한 스터디</h2>

            {myAppliedStudies.length === 0 ? (
              <p className="emptyText">신청한 스터디가 없습니다.</p>
            ) : (
              <div className="studyGrid">
                {myAppliedStudies.map((study) => (
                  <StudyItem key={study.id} study={study} userId={String(user._id)} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function StudyItem({ study, userId }: { study: StudyCardData; userId: string }) {
  const isFull = study.currentMembers >= study.maxMembers;
  const statusBadgeClass = study.isClosed ? 'badgeSecondary' : isFull ? 'badgeOutline' : 'badgeDefault';
  const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';

  const myParticipant = study.participants.find((p) => p.userId === userId);
  const participantBadgeClass = myParticipant?.status === 'approved' ? 'badgeApproved' : myParticipant?.status === 'rejected' ? 'badgeRejected' : 'badgePending';
  const participantLabel = myParticipant?.status === 'approved' ? '승인됨' : myParticipant?.status === 'rejected' ? '거절됨' : '대기중';

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="badgeRow">
          <span className={`badge ${statusBadgeClass}`}>{statusLabel}</span>
          <span className="badge badgeOutline">{study.category}</span>
          <span className={`badge ${participantBadgeClass}`}>{participantLabel}</span>
        </div>
        <h3 className="cardTitle">{study.title}</h3>
      </div>

      <div className="cardContent">
        <p className="cardDescription">{study.description}</p>
      </div>

      <div className="cardFooter">
        <div className="hostInfo">
          <div className="avatar">{(study.hostName || '스터디장').charAt(0)}</div>
          <span className="hostName">{study.hostName || '스터디장'}</span>
          <span className="memberCount">
            <FaUser size={12} />
            {study.currentMembers}/{study.maxMembers}
          </span>
        </div>
        <Link href={`/study/${study.id}`} className="btnOutline">
          자세히 보기
        </Link>
      </div>
    </div>
  );
}

function BookmarkCard({ study }: { study: Study }) {
  const router = useRouter();

  const startDate = study.extra?.startDate;
  const safeDate = startDate && !Number.isNaN(new Date(startDate).getTime()) ? format(new Date(startDate), 'yyyy-MM-dd', { locale: ko }) : startDate || '-';

  return (
    <button type="button" className="bookmarkCard" onClick={() => router.push(`/study/${study.id}`)}>
      <div className="bookmarkIconRow">
        <FaBookmark />
      </div>

      <div className="bookmarkCardBody">
        <div className="bookmarkThumbnail" />
        <div className="bookmarkCardInfo">
          <h3 className="bookmarkTitle">{study.name}</h3>
          <div className="bookmarkMetaList">
            <div className="bookmarkMetaItem">
              <FaMapMarkerAlt />
              <span className="bookmarkMetaText">{study.extra?.location?.name ?? '-'}</span>
            </div>
            <div className="bookmarkMetaItem">
              <FaChevronDown />
              <span>20대, 무관</span>
            </div>
            <div className="bookmarkMetaItem">
              <FaUsers size={14} />
              <span>인원 {study.extra?.maxMembers ?? 0}명</span>
            </div>
            <div className="bookmarkMetaItem">
              <FaCalendar />
              <span>{safeDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bookmarkArrowRow">
        <FaArrowRight />
      </div>
    </button>
  );
}
