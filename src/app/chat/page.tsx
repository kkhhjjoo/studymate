'use client';

import Link from 'next/link';
import useUserStore from '@/zustand/userStore';
import './Chat.css';
import { FiMessageCircle } from 'react-icons/fi';

// TODO: lib/types/action 폴더 연결 후 실제 데이터로 교체
const studies: {
  id: string;
  hostId: number;
  hostName: string;
  title: string;
  category: string;
  participants: { userId: number }[];
}[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getMessageForStudy = (_studyId: string): { userName: string; content: string }[] => [];

const Chat = () => {
  const user = useUserStore((state) => state.user);

  //내가 호스트이거나 참여 신청한 스터디만 표시
  const myStudies = studies.filter((study) => study.hostId === user?._id || study.participants.some((p) => p.userId === user?._id));
  return (
    <div className="pageWrapper">
      <main className="main">
        <h1 className="pageTitle">
          <FiMessageCircle className="pageTitleIcon" />
          채팅
        </h1>
        {!user ? (
          <p className="emptyMessage">
            채팅 목록을 보려면{' '}
            <Link href="/login" className="loginLink">
              로그인
            </Link>
            해주세요.
          </p>
        ) : myStudies.length === 0 ? (
          <p className="emptyMessage">참여중인 스터디가 없습니다.</p>
        ) : (
          <div className="cardList">
            {myStudies.map((study) => {
              const msgs = getMessageForStudy(study.id);
              const lastMsg = msgs[msgs.length - 1];

              return (
                <Link key={study.id} href={`/study/${study.id}?tab=chat`}>
                  <div className="card">
                    <div className="cardContent">
                      <div className="avatar">
                        <span className="avatarFallback">{study.hostName.charAt(0)}</span>
                      </div>

                      {/* 스터디 정보 */}
                      <div className="cardBody">
                        <div className="cardHeader">
                          <span className="studyTitle">{study.title}</span>
                          <span className="categoryBadge">{study.category}</span>
                        </div>
                        <p className="lastMessage">{lastMsg ? `${lastMsg.userName}: ${lastMsg.content}` : '메시지가 없습니다'}</p>
                      </div>

                      {/* 메시지 수 뱃지 */}
                      {msgs.length > 0 && <span className="countBadge">{msgs.length}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
