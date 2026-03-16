'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Study as ApiStudy, StudyCardData } from '@/types/studies';
import './Detail.css';

import { ParticipantManage } from '@/app/components/participant-manager/participant-manager';
import StudyMap from '@/app/components/StudyMap';
import useUserStore from '@/zustand/userStore';
import { toast, ToastContainer } from 'react-toastify';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiMapPin, FiSettings, FiSend, FiUsers, FiClock, FiCalendar, FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getStudyDetail } from '@/lib/study';

// TODO: lib/actions 연결 후 실제 함수로 교체
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getMessagesForStudy = (_id: number | string): { id: string; userId: number; userName: string; content: string }[] => [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendMessage = (_studyId: number | string, _content: string): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addBookmarkAPI = async (_studyId: number | string, _token: string): Promise<boolean> => false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const applyToStudy = (_studyId: number | string, _message: string): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toggleStudyClosed = (_studyId: number | string): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deleteStudy = (_studyId: number | string): void => {};

function toStudyCardData(s: ApiStudy): StudyCardData {
  return {
    id: s.id,
    title: s.name,
    hostId: s.extra?.hostId ?? '',
    hostName: s.extra?.hostName ?? '',
    category: s.extra?.category ?? '',
    tags: s.extra?.tags ?? [],
    maxMembers: s.extra?.maxMembers ?? 0,
    currentMembers: s.extra?.participant?.filter((p) => p.status === 'approved').length ?? 0,
    isClosed: s.extra?.isClosed ?? false,
    description: s.content,
    schedule: s.extra?.schedule ?? '',
    startDate: s.extra?.startDate,
    endDate: s.extra?.endDate,
    location: s.extra?.location ?? { name: '-', lat: 0, lng: 0 },
    participants: s.extra?.participant?.map((p) => ({
      id: p.userId,
      userId: p.userId,
      userName: p.userName,
      status: p.status,
      message: '',
      appliedAt: p.joinedAt ?? '',
    })) ?? [],
  };
}

async function fetchProductByIdAPI(id: string | number, _accessToken: string): Promise<StudyCardData | null> {
  const res = await getStudyDetail(id);
  if (!('ok' in res) || res.ok === 0) return null;
  const apiStudy = res.item as unknown as ApiStudy;
  if (!apiStudy) return null;
  return toStudyCardData(apiStudy);
}

export default function StudyDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeUser = useUserStore((state) => state.user);
  const currentUser = storeUser;
  const accessToken = storeUser?.token?.accessToken ?? '';

  const [study, setStudy] = useState<StudyCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isDeleteDiallogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultTab = searchParams.get('tab') ?? 'chat';
  const [activeTab, setActiveTab] = useState(defaultTab);

  //다이얼로그 ref
  const applyDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  // TODO: lib 연결 후 실제 fetch 로직으로 교체
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchProductByIdAPI(id, accessToken)
      .then((apiStudy) => {
        if (!cancelled) setStudy(apiStudy ?? null);
      })
      .catch(() => {
        if (!cancelled) setStudy(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, accessToken]);

  const messages = useMemo(() => (study ? getMessagesForStudy(study.id) : []), [study]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  //다이얼로그 열기/닫기
  useEffect(() => {
    const el = applyDialogRef.current;
    if (!el) return;
    isApplyDialogOpen ? el.showModal() : el.close();
  }, [isApplyDialogOpen]);

  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    isDeleteDiallogOpen ? el.showModal() : el.close();
  }, [isDeleteDiallogOpen]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !study) return;
    sendMessage(study.id, chatInput.trim());
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="pageWrapper">
        <main className="main">
          <p className="centerMessage">로딩 중...</p>
        </main>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="pageWrapper">
        <main className="main">
          <p className="centerTitle">스터디를 찾을 수 없습니다</p>
          <div style={{ textAlign: 'center' }}>
            <Link href="/" className="btnPrimary" style={{ display: 'inline-flex', width: 'auto' }}>
              홈으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 역할 계산
  const isHost = Boolean(currentUser && study.hostId && String(study.hostId) === String(currentUser._id));
  const isApprovedParticipant = currentUser ? study.participants.some((p) => String(p.userId) === String(currentUser._id) && p.status === 'approved') : false;
  const canViewChat = isHost || isApprovedParticipant;
  const hasApplied = currentUser ? study.participants.some((p) => String(p.userId) === String(currentUser._id)) : false;
  const isFull = study.currentMembers >= study.maxMembers;
  const canApply = !isHost && !hasApplied && !study.isClosed && !isFull;

  // 모집 상태 뱃지 클래스
  const statusBadgeClass = study.isClosed ? 'badgeMuted' : isFull ? 'badgeAmber' : 'badgeDefault';
  const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';

  const handleBookmark = async () => {
    if (!accessToken || isBookmarking) return;
    setIsBookmarking(true);
    try {
      const ok = await addBookmarkAPI(study.id, accessToken);
      if (ok) {
        setIsBookmarked(true);
        toast.success('북마크에 추가되었습니다.');
      } else toast.error('북마크 추가에 실패했습니다.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleApply = () => {
    if (!applyMessage.trim()) return;
    applyToStudy(study.id, applyMessage.trim());
    setApplyMessage('');
    setIsApplyDialogOpen(false);
    fetchProductByIdAPI(study.id, accessToken).then((u) => u && setStudy(u));
  };

  return (
    <div className="pageWrapper">
      <ToastContainer />

      <main className="main">
        {/* 뒤로가기 */}
        <Link href="/" className="backButton">
          <FiArrowLeft size={16} />
          목록으로
        </Link>

        <div className="grid">
          {/* ── 왼쪽 ── */}
          <div className="leftCol">
            {/* 뱃지 */}
            <div>
              <div className="badgeRow">
                <span className={`badge ${statusBadgeClass}`}>{statusLabel}</span>
                <span className="badge badgeOutline">{study.category}</span>
              </div>

              {/* 제목 */}
              <h1 className="studyTitle">{study.title}</h1>

              {/* 호스트 */}
              <div className="hostRow">
                <div className="avatar">{(study.hostName || '스터디장').charAt(0)}</div>
                <div>
                  <p className="hostName">{study.hostName || '스터디장'}</p>
                  <p className="hostRole">스터디장</p>
                </div>
              </div>

              {/* 태그 + 북마크 */}
              <div className="tagRow">
                <div className="tagList">
                  {study.tags.map((tag) => (
                    <span key={tag} className="badge badgeSecondary">
                      {tag}
                    </span>
                  ))}
                </div>
                {currentUser && (
                  <button className={`bookmarkBtn ${isBookmarked ? 'bookmarkBtnActive' : ''}`} onClick={handleBookmark} disabled={isBookmarking || isBookmarked}>
                    <FiHeart className={`bookmarkIcon ${isBookmarked ? 'bookmarkIconFilled' : ''}`} />
                  </button>
                )}
              </div>

              <p className="description">{study.description}</p>
            </div>

            {/* ── 탭 ── */}
            <div className="tabWrapper">
              <div className={`tabList ${!isHost ? 'tabList2col' : ''}`}>
                {(['chat', 'map', ...(isHost ? ['manage'] : [])] as string[]).map((tab) => (
                  <button key={tab} className={`tabTrigger ${activeTab === tab ? 'tabTriggerActive' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'chat' && (
                      <>
                        <FiMessageCircle size={16} />
                        채팅
                      </>
                    )}
                    {tab === 'map' && (
                      <>
                        <FiMapPin size={16} />
                        위치
                      </>
                    )}
                    {tab === 'manage' && (
                      <>
                        <FiSettings size={16} />
                        관리
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* 채팅 탭 */}
              {activeTab === 'chat' && (
                <div className="tabContent">
                  <div className="chatCard">
                    {!canViewChat ? (
                      <div className="chatLocked">{currentUser ? '참여 승인 후 채팅을 이용할 수 있습니다.' : '채팅하려면 로그인 후 스터디에 참여해주세요.'}</div>
                    ) : (
                      <>
                        <div ref={scrollRef} className="chatMessages">
                          {messages.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af', marginTop: '2rem' }}>첫 메시지를 보내보세요!</p>
                          ) : (
                            messages.map((msg) => {
                              const isMine = storeUser?._id === msg.userId;
                              return (
                                <div key={msg.id} className={`msgRow ${isMine ? 'msgRowMine' : ''}`}>
                                  <div className="msgAvatar">{(msg.userName || '').charAt(0)}</div>
                                  <div className={`msgBody ${isMine ? 'msgBodyMine' : ''}`}>
                                    <span className="msgName">{msg.userName}</span>
                                    <div className={`msgBubble ${isMine ? 'msgBubbleMine' : 'msgBubbleOther'}`}>{msg.content}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        {storeUser && (
                          <div className="chatInputRow">
                            <input className="chatInput" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="메시지를 입력하세요..." />
                            <button className="chatSendBtn" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                              <FiSend size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 위치 탭 */}
              {activeTab === 'map' && (
                <div className="tabContent">
                  <StudyMap location={study.location} />
                </div>
              )}

              {/* 관리 탭 */}
              {isHost && activeTab === 'manage' && (
                <div className="tabContent">
                  <ParticipantManage study={study} updateParticipantStatus={() => {}} />
                </div>
              )}
            </div>
          </div>

          {/* ── 사이드바 ── */}
          <aside className="aside">
            {/* 스터디 정보 카드 */}
            <div className="infoCard">
              <div className="infoCardHeader">
                <p className="infoCardTitle">스터디 정보</p>
              </div>
              <div className="infoCardBody">
                <div className="infoRow">
                  <FiUsers className="infoIcon" />
                  <div>
                    <p className="infoLabel">모집 인원</p>
                    <p className="infoValue">
                      {study.currentMembers} / {study.maxMembers}명
                    </p>
                  </div>
                </div>
                <div className="infoRow">
                  <FiClock className="infoIcon" />
                  <div>
                    <p className="infoLabel">일정</p>
                    <p className="infoValue">{study.schedule}</p>
                  </div>
                </div>
                <div className="infoRow">
                  <FiCalendar className="infoIcon" />
                  <div>
                    <p className="infoLabel">기간</p>
                    <p className="infoValue">
                      {study.startDate && !Number.isNaN(new Date(study.startDate).getTime()) ? format(new Date(study.startDate), 'yyyy.MM.dd', { locale: ko }) : study.startDate || '-'}
                      {study.endDate && !Number.isNaN(new Date(study.endDate).getTime()) && ` - ${format(new Date(study.endDate), 'yyyy.MM.dd', { locale: ko })}`}
                      {study.endDate && Number.isNaN(new Date(study.endDate).getTime()) && ` - ${study.endDate}`}
                    </p>
                  </div>
                </div>
                <div className="infoRow">
                  <FiMapPin className="infoIcon" />
                  <div>
                    <p className="infoLabel">장소</p>
                    <p className="infoValue">{study.location.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 참여 신청 버튼 */}
            {canApply && (
              <button className="btnPrimary" onClick={() => setIsApplyDialogOpen(true)}>
                <FiUserPlus size={16} />
                참여 신청하기
              </button>
            )}

            {/* 신청 완료 안내 */}
            {hasApplied && !isHost && (
              <div className="appliedCard">
                <p className="appliedText">
                  참여 신청이 완료되었습니다.
                  <br />
                  스터디장의 승인을 기다려주세요.
                </p>
              </div>
            )}

            {/* 호스트 전용 버튼 */}
            {isHost && (
              <>
                <button className={study.isClosed ? 'btnPrimary' : 'btnOutline'} onClick={() => toggleStudyClosed(study.id)}>
                  {study.isClosed ? '모집 재개하기' : '모집 마감하기'}
                </button>
                <button className="btnOutline" onClick={() => router.push(`/study/${study.id}/edit`)}>
                  <FiEdit2 size={15} />
                  스터디 수정
                </button>
                <button className="btnDestructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <FiTrash2 size={15} />
                  스터디 삭제
                </button>
              </>
            )}
          </aside>
        </div>
      </main>

      {/* ── 참여 신청 다이얼로그 ── */}
      <dialog ref={applyDialogRef} className="dialog" onClose={() => setIsApplyDialogOpen(false)}>
        <p className="dialogTitle">스터디 참여 신청</p>
        <p className="dialogDesc">스터디장에게 전달할 메시지를 작성해주세요.</p>
        <textarea className="dialogTextarea" rows={4} placeholder="자기소개, 참여 동기 등을 적어주세요." value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
        <div className="dialogFooter">
          <button className="dialogBtnOutline" onClick={() => setIsApplyDialogOpen(false)}>
            취소
          </button>
          <button className="dialogBtnPrimary" onClick={handleApply} disabled={!applyMessage.trim()}>
            신청하기
          </button>
        </div>
      </dialog>

      {/* ── 삭제 확인 다이얼로그 ── */}
      <dialog ref={deleteDialogRef} className="dialog" onClose={() => setIsDeleteDialogOpen(false)}>
        <p className="dialogTitle">스터디 삭제</p>
        <p className="dialogDesc">정말 이 스터디를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <div className="dialogFooter">
          <button className="dialogBtnOutline" onClick={() => setIsDeleteDialogOpen(false)}>
            취소
          </button>
          <button
            className="dialogBtnDestructive"
            onClick={() => {
              deleteStudy(study.id);
              router.push('/');
            }}
          >
            삭제
          </button>
        </div>
      </dialog>
    </div>
  );
}
