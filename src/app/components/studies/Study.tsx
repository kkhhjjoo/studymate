'use client';

import Link from 'next/link';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { StudyCardData } from '@/types/studies';
import { LuCrown } from 'react-icons/lu';
import { FaUser } from 'react-icons/fa';
import styles from './Study.module.css';

interface Props {
  studies: StudyCardData[];
  hideHeader?: boolean;
}

type HostStatusBadge = 'badgeSecondary' | 'badgeOutline' | 'badgeDefault';
type ParticipantStatusBadge = 'badgeApproved' | 'badgeRejected' | 'badgePending';

export default function MyStudy({ studies, hideHeader = false }: Props) {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <div className={styles.pageWrapper}>
        {!hideHeader && <Header />}
        <main className={styles.loginPrompt}>
          <p className={styles.loginText}>
            내 스터디 보려면{' '}
            <Link href="/login" className={styles.loginLink}>
              로그인
            </Link>
          </p>
        </main>
      </div>
    );
  }

  const myHostStudies = studies.filter(
    (s) => String(s.hostId) === String(user._id) || String(s.sellerId) === String(user._id)
  );

  const StudyItem = ({ study, role }: { study: StudyCardData; role: 'host' | 'participant' }) => {
    const isFull = study.currentMembers >= study.maxMembers;
    const myParticipant = study.participants.find((p) => String(p.userId) === String(user._id));

    const statusBadgeClass: HostStatusBadge = study.isClosed ? 'badgeSecondary' : isFull ? 'badgeOutline' : 'badgeDefault';
    const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';

    const participantBadgeClass: ParticipantStatusBadge =
      myParticipant?.status === 'approved' ? 'badgeApproved' : myParticipant?.status === 'rejected' ? 'badgeRejected' : 'badgePending';

    const participantLabel =
      myParticipant?.status === 'approved' ? '승인됨' : myParticipant?.status === 'rejected' ? '거절됨' : '대기중';

    return (
      <div className={`${styles.card} ${study.isClosed ? styles.cardClosed : ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles[statusBadgeClass]}`}>{statusLabel}</span>
            <span className={`${styles.badge} ${styles.badgeOutline}`}>{study.category}</span>
            {role === 'host' ? (
              <span className={`${styles.badge} ${styles.badgeHost}`}>
                <LuCrown size={12} />
                스터디장
              </span>
            ) : (
              <span className={`${styles.badge} ${styles[participantBadgeClass]}`}>{participantLabel}</span>
            )}
          </div>
          <h3 className={styles.cardTitle}>{study.title}</h3>
        </div>

        <div className={styles.cardContent}>
          <p className={styles.cardDescription}></p>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.hostInfo}>
            <div className={styles.avatar}>{study.hostName.charAt(0)}</div>
            <span className={styles.hostName}>{study.hostName}</span>
            <span className={styles.memberCount}>
              <FaUser size={12} className={styles.memberIcon} />
              {study.currentMembers}/{study.maxMembers}
            </span>
          </div>
          <Link href={`/study/${study.id}`} className={styles.btnOutline}>
            자세히 보기
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      {!hideHeader && <Header />}
      <main className={styles.studyMain}>
        <h1 className={styles.pageTitle}>내 스터디</h1>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <LuCrown size={20} color="#eab308" />
            내가 만든 스터디
            <span className={styles.sectionCount}>({myHostStudies.length})</span>
          </h2>

          {myHostStudies.length === 0 ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 7v14"></path>
                  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
                <p className={styles.emptyText}>아직 만든 스터디가 없습니다.</p>
                <Link href="/create" className={styles.btnPrimary}>
                  스터디 만들기
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.studyGrid}>
              {myHostStudies.map((study) => (
                <StudyItem key={study.id} study={study} role="host" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
