'use client';

import type { Participant } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import './participant-manager.css';

interface ParticipantManagerProps {
  study: {
    id: string | number;
    participants: Pick<Participant, 'id' | 'userName' | 'status' | 'message' | 'appliedAt'>[];
  };
  updateParticipantStatus: (studyId: string, participantId: string, status: 'approve' | 'rejected') => void;
}

export function ParticipantManage({ study, updateParticipantStatus }: ParticipantManagerProps) {
  //상태별 참여자 분류
  const pendingParticipants = study.participants.filter((p) => p.status === 'pending');
  const approvedParticipants = study.participants.filter((p) => p.status === 'approved');
  const rejectedParticipants = study.participants.filter((p) => p.status === 'rejected');

  //참여자 승인
  const handleApprove = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'approve');
  };
  //참여자 거절
  const handleReject = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'rejected');
  };

  //참여자 카드 서브 컴포넌트 - showActions가 true이면 승인/거절 버튼을 표시
  const ParticipantCard = ({
    participant,
    showActions,
  }: {
    participant: Participant;
    showActions?: boolean;
  }) => (
    <div className="participantCard">
      <div className="info">
        <div className="nameRow">
          <span className="userName">{participant.userName}</span>
          {participant.status === 'approved' && (<span className="badge badgeGreen">승인됨</span>)}
          {participant.status === 'rejected' && (
            <span className="badge badgeRed">거절됨</span>
          )}
        </div>
        <p className="message">{participant.message}</p>
        <p className='date'>{format(new Date(participant.appliedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</p>
      </div>
      {showActions && (
        <div className='actions'>
          <button className='actionBtn approveBtn' onClick={() => handleApprove(participant.id)} title="승인">✓</button>
          <button className="actionBtn rejectBtn" onClick={() => handleReject(participant.id)} title="거절">✕</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="participant-manager">

      {/* 대기 중인 신청 */}
      <div className="pm-card">
        <div className="pm-card-header">
          <h3 className="pm-card-title">
            <span className="icon-amber">⏱</span>
            대기 중인 신청
          </h3>
          <span className="pm-count-badge">{pendingParticipants.length}</span>
        </div>
        <div className="pm-card-body">
          {pendingParticipants.length === 0 ? (
            <p className="pm-empty-text">대기 중인 신청이 없습니다.</p>
          ) : (
            <div className="pm-list">
              {pendingParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 승인된 멤버 */}
      <div className="pm-card">
        <div className="pm-card-header">
          <h3 className="pm-card-title">
            <span className="icon-green">✔</span>
            승인된 멤버
          </h3>
          <span className="pm-count-badge">{approvedParticipants.length}</span>
        </div>
        <div className="pm-card-body">
          {approvedParticipants.length === 0 ? (
            <p className="pm-empty-text">승인된 멤버가 없습니다.</p>
          ) : (
            <div className="pm-list">
              {approvedParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 거절된 신청 (있을 때만 렌더링) */}
      {rejectedParticipants.length > 0 && (
        <div className="pm-card">
          <div className="pm-card-header">
            <h3 className="pm-card-title">
              <span className="icon-red">✖</span>
              거절된 신청
            </h3>
            <span className="pm-count-badge">{rejectedParticipants.length}</span>
          </div>
          <div className="pm-card-body">
            <div className="pm-list">
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
