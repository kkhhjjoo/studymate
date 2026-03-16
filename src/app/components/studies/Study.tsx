'use client';

import Link from 'next/link';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { StudyCardData } from '@/types/studies';
import { LuCrown } from "react-icons/lu";
import { FaUser } from "react-icons/fa";
import './Study.css';

interface Props {
  studies: StudyCardData[];
  hideHeader?: boolean;
}

export default function MyStudy({ studies, hideHeader = false }: Props) {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <div className="pageWrapper">
        {!hideHeader && <Header />}
        <main className="loginPrompt">
          <p className="loginText">
            내 스터디 보려면{' '}
            <Link href="/login" className="loginLink">
              로그인
            </Link>
          </p>
        </main>
      </div>
    );
  }

  // 내가 만든 스터디 필터링
  const myHostStudies = studies.filter((s) => String(s.hostId) === String(user._id));

  /** 스터디 카드 서브 컴포넌트 — 역할(host/participant)에 따라 배지를 다르게 표시 */
  const StudyItem = ({
    study,
    role,
  }: {
    study: StudyCardData;
    role: 'host' | 'participant';
  }) => {
    const isFull = study.currentMembers >= study.maxMembers;
    const myParticipant = study.participants.find(
      (p) => String(p.userId) === String(user._id)
    );

    //모집 상태 배지 클래스
    const statusBadgeClass = study.isClosed ? 'badgeSecondary' : isFull ? 'badgeOutline' : 'badgeDefault';

    const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';

    //참여자 상태 배지 클래스
    const participantBadgeClass = myParticipant?.status === 'approved' ? 'badgeApproved' : myParticipant?.status === 'rejected' ? 'badgeRejected' : 'badgePending';

    const participantLabel =
      myParticipant?.status === 'approved'
        ? '승인됨'
        : myParticipant?.status === 'rejected'
        ? '거절됨'
        : '대기중';

    return (
      <div className="card">
        <div className="cardHeader">
          <div className="badgeRow">
            <span className={`badge ${statusBadgeClass}`}>{statusLabel}</span>
            <span className="badge badgeOutline">{study.category}</span>
            {role === 'host' ? (
              <span className='badge badgeHost'>
                <LuCrown size={12} />
                스터디장
              </span>
            ) : (
              <span className={`badge ${participantBadgeClass}`}>
                {participantLabel}
              </span>
            )}
          </div>
          <h3 className='cardTitle'>{study.title}</h3>
        </div>

        {/* 카드 본문 */}
        <div className="cardContent">
          <p className="cardDescription"></p>
        </div>

        {/* 카드 푸터 */}
        <div className="cardFooter">
          <div className="hostInfo">
            {/* 아바타 */}
            <div className="avatar">{study.hostName.charAt(0)}</div>
            <span className="hostName">{study.hostName}</span>
            <span className="memberCount">
              <FaUser size={12} className="memberIcon" />
              {study.currentMembers}/{study.maxMembers}
            </span>
          </div>
          <Link href={`/study/${study.id}`} className='btnOutline'>
            자세히 보기
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="pageWrapper">
      {!hideHeader && <Header />}
      <main className="studyMain">
        <h1 className="pageTitle">내 스터디</h1>
        {/* 내가 만든 스터디 */}
        <section className="section">
          <h2 className="sectionTitle">
            <LuCrown size={20} color="#eab308" />
            내가 만든 스터디
            <span className="sectionCount">({myHostStudies.length})</span>
          </h2>

          {myHostStudies.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 7v14"></path>
                  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
                <p className="emptyText">아직 만든 스터디가 없습니다.</p>
                <Link href="/create" className="btnPrimary"></Link>
              </div>
            </div>
          ) : (
            <div className="studyGrid">
              {myHostStudies.map((study) => <StudyItem key={study.id} study={study} role="host" />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
