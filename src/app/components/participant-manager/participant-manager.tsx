'use client';

import type { Participant } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from './participant-manager.module.css';

interface ParticipantManagerProps {
  study: {
    id: string | number;
    participants: Pick<Participant, 'id' | 'userName' | 'status' | 'message' | 'appliedAt'>[];
  };
  updateParticipantStatus: (studyId: string, participantId: string, status: 'approve' | 'rejected') => void;
}

export function ParticipantManage({ study, updateParticipantStatus }: ParticipantManagerProps) {
  const pendingParticipants = study.participants.filter((p) => p.status === 'pending');
  const approvedParticipants = study.participants.filter((p) => p.status === 'approved');
  const rejectedParticipants = study.participants.filter((p) => p.status === 'rejected');

  const handleApprove = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'approve');
  };

  const handleReject = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'rejected');
  };

  type CardParticipant = Pick<Participant, 'id' | 'userName' | 'status' | 'message' | 'appliedAt'>;

  const ParticipantCard = ({
    participant,
    showActions,
  }: {
    participant: CardParticipant;
    showActions?: boolean;
  }) => (
    <div className={styles.participantCard}>
      <div className={styles.participantInfo}>
        <div className={styles.participantNameRow}>
          <span className={styles.participantUsername}>{participant.userName}</span>
          {participant.status === 'approved' && <span className={`${styles.participantBadge} ${styles.badgeGreen}`}>승인됨</span>}
          {participant.status === 'rejected' && <span className={`${styles.participantBadge} ${styles.badgeRed}`}>거절됨</span>}
        </div>
        <p className={styles.participantMessage}>{participant.message}</p>
        <p className={styles.participantDate}>
          {participant.appliedAt && !Number.isNaN(new Date(participant.appliedAt).getTime())
            ? format(new Date(participant.appliedAt), 'yyyy.MM.dd HH:mm', { locale: ko })
            : '-'}
        </p>
      </div>
      {showActions && (
        <div className={styles.participantActions}>
          <button type="button" className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => handleApprove(participant.id)} title="승인">
            ✓
          </button>
          <button type="button" className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={() => handleReject(participant.id)} title="거절">
            ✕
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.participantManager}>
      <div className={styles.pmCard}>
        <div className={styles.pmCardHeader}>
          <h3 className={styles.pmCardTitle}>
            <span className={styles.iconAmber}>⏱</span>
            대기 중인 신청
          </h3>
          <span className={styles.pmCountBadge}>{pendingParticipants.length}</span>
        </div>
        <div className={styles.pmCardBody}>
          {pendingParticipants.length === 0 ? (
            <p className={styles.pmEmptyText}>대기 중인 신청이 없습니다.</p>
          ) : (
            <div className={styles.pmList}>
              {pendingParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} showActions />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.pmCard}>
        <div className={styles.pmCardHeader}>
          <h3 className={styles.pmCardTitle}>
            <span className={styles.iconGreen}>✔</span>
            승인된 멤버
          </h3>
          <span className={styles.pmCountBadge}>{approvedParticipants.length}</span>
        </div>
        <div className={styles.pmCardBody}>
          {approvedParticipants.length === 0 ? (
            <p className={styles.pmEmptyText}>승인된 멤버가 없습니다.</p>
          ) : (
            <div className={styles.pmList}>
              {approvedParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          )}
        </div>
      </div>

      {rejectedParticipants.length > 0 && (
        <div className={styles.pmCard}>
          <div className={styles.pmCardHeader}>
            <h3 className={styles.pmCardTitle}>
              <span className={styles.iconRed}>✖</span>
              거절된 신청
            </h3>
            <span className={styles.pmCountBadge}>{rejectedParticipants.length}</span>
          </div>
          <div className={styles.pmCardBody}>
            <div className={styles.pmList}>
              {rejectedParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
