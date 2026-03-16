'use client';

import Link from 'next/link';
import { FaUser, FaUsers } from 'react-icons/fa';
import { StudyCardData } from '@/types/studies';

function StudyItem({ study, userId }: { study: StudyCardData; userId: string }) {
  const isFull = study.currentMembers >= study.maxMembers;
  const statusBadgeClass = study.isClosed ? 'badgeSecondary' : isFull ? 'badgeOutline' : 'badgeDefault';
  const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';

  const myParticipant = study.participants.find((p) => p.userId === userId);
  const participantBadgeClass =
    myParticipant?.status === 'approved' ? 'badgeApproved' : myParticipant?.status === 'rejected' ? 'badgeRejected' : 'badgePending';
  const participantLabel =
    myParticipant?.status === 'approved' ? '승인됨' : myParticipant?.status === 'rejected' ? '거절됨' : '대기중';

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

interface Props {
  studies: StudyCardData[];
  userId: string;
}

export default function ParticipatedSection({ studies, userId }: Props) {
  return (
    <section>
      <h2 className="sectionTitle sectionTitleWithIcon">
        <FaUser size={20} className="sectionTitleIcon" aria-hidden />
        <span className="sectionTitleText">참여 신청한 스터디</span>
        <span className="sectionTitleCount">({studies.length})</span>
      </h2>

      {studies.length === 0 ? (
        <div className="emptyBox">
          <FaUsers size={36} style={{ color: '#d1d5db', margin: '0 auto 8px', display: 'block' }} />
          <p className="emptyText">신청한 스터디가 없습니다.</p>
          <Link href="/" className="btnOutline">
            스터디 찾기
          </Link>
        </div>
      ) : (
        <div className="studyGrid">
          {studies.map((study) => (
            <StudyItem key={study.id} study={study} userId={userId} />
          ))}
        </div>
      )}
    </section>
  );
}
