'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Study as ApiStudy, StudyCardData, StudyExtra } from '@/types/studies';
import styles from './Detail.module.css';

import { ParticipantManage } from '@/app/components/participant-manager/participant-manager';
import StudyMap from '@/app/components/StudyMap';
import { toast, ToastContainer } from 'react-toastify';
import useUserStore from '@/zustand/userStore';
import 'react-toastify/dist/ReactToastify.css';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiMapPin, FiSettings, FiSend, FiUsers, FiClock, FiCalendar, FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getStudyDetail, updateStudyAPI, deleteStudyAPI } from '@/lib/study';

const addBookmarkAPI = async (_studyId: number | string, _token: string): Promise<boolean> => false;

const applyToStudy = (_studyId: number | string, _message: string): void => {};

const deleteStudy = (_studyId: number | string): void => {};

function toStudyCardData(s: ApiStudy): StudyCardData {
  return {
    id: s.id,
    title: s.name,
    // 호스트 정보: extra에 없으면 seller 정보로 보완
    hostId: s.extra?.hostId ?? String((s.seller && s.seller._id) ?? s.seller_id ?? ''),
    hostName: s.extra?.hostName ?? s.seller?.name ?? '스터디장',
    category: s.extra?.category ?? '',
    tags: s.extra?.tags ?? [],
    // 총 인원 / 현재 인원은 quantity / buyQuantity 기준
    maxMembers: s.quantity ?? s.extra?.maxMembers ?? 0,
    currentMembers: s.buyQuantity ?? 0,
    isClosed: s.extra?.isClosed ?? false,
    description: s.content,
    schedule: s.extra?.schedule ?? '',
    startDate: s.extra?.startDate,
    endDate: s.extra?.endDate,
    location: s.extra?.location ?? { name: '-', lat: 0, lng: 0 },
    participants:
      s.extra?.participant?.map((p) => ({
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
  const apiStudy: ApiStudy = res.item;
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
  const [hasAppliedLocal, setHasAppliedLocal] = useState(false);

  type StudyMessage = {
    id: string;
    userId: number | string;
    userName: string;
    content: string;
  };
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultTab = searchParams.get('tab') ?? 'chat';
  const [activeTab, setActiveTab] = useState(defaultTab);

  //다이얼로그 ref
  const applyDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  // TODO: lib 연결 후 실제 fetch 로직으로 교체
  useEffect(() => {
    let cancelled = false;

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
    if (!chatInput.trim() || !study || !currentUser) return;

    const newMessage: StudyMessage = {
      id: `${Date.now()}`,
      userId: currentUser._id,
      userName: currentUser.name ?? '나',
      content: chatInput.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.main}>
          <p className={styles.centerMessage}>로딩 중...</p>
        </main>
      </div>
    );
  }

  if (!study) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.main}>
          <p className={styles.centerTitle}>스터디를 찾을 수 없습니다</p>
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
  const hasAppliedFromServer = currentUser ? study.participants.some((p) => String(p.userId) === String(currentUser._id)) : false;
  const hasApplied = hasAppliedFromServer || hasAppliedLocal;
  const isFull = study.maxMembers > 0 && study.currentMembers >= study.maxMembers;
  const canApply = !isHost && !hasApplied && !study.isClosed && !isFull;

  // 모집 상태 뱃지 클래스
  const statusBadgeClass = study.isClosed ? 'badgeMuted' : isFull ? 'badgeAmber' : 'badgeDefault';
  const statusLabel = study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중';
  // 카테고리 배지: category가 없으면 첫 번째 태그, 둘 다 없으면 표시하지 않음
  const categoryLabel = study.category || (study.tags && study.tags[0]) || '';

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
    setHasAppliedLocal(true);
    fetchProductByIdAPI(study.id, accessToken).then((u) => u && setStudy(u));
  };

  const handleDelete = async () => {
    if (!study || !accessToken) return;

    // 삭제 다이얼로그에서 이미 한 번 확인했으므로 추가 confirm 없이 바로 진행
    setIsDeleteDialogOpen(false);

    // 최신 상품 상세를 다시 조회해서 _id 기준으로 삭제 (id가 0이거나 undefined인 예전 데이터 대비)
    const detail = await getStudyDetail(id);
    if (!('ok' in detail) || detail.ok === 0 || !detail.item) {
      toast.error('스터디 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const apiStudy: ApiStudy = detail.item;
    const productId = String(apiStudy._id ?? apiStudy.id ?? id);

    const ok = await deleteStudyAPI(productId, accessToken);
    if (ok) {
      toast.success('스터디가 삭제되었습니다.');
      router.push('/');
    } else {
      toast.error('스터디 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleToggleClosed = async () => {
    if (!study || !accessToken) return;

    const nextClosed = !study.isClosed;
    // 낙관적 업데이트
    setStudy({ ...study, isClosed: nextClosed });

    // 서버에서 최신 extra를 가져와 isClosed만 토글해서 전송 (기존 필드 보존)
    const detail = await getStudyDetail(id);
    if (!('ok' in detail) || detail.ok === 0 || !detail.item) {
      setStudy((prev) => (prev ? { ...prev, isClosed: !nextClosed } : prev));
      toast.error('모집 상태를 불러오지 못했습니다.');
      return;
    }

    const apiStudy: ApiStudy = detail.item;
    const apiExtra: Partial<StudyExtra> = apiStudy.extra ?? {};

    const mergedExtra = {
      ...apiExtra,
      // 모집 상태
      isClosed: nextClosed,
      // 모집 인원
      maxMembers: apiExtra.maxMembers ?? study.maxMembers,
      // 일정/장소/기간 정보 유지
      schedule: apiExtra.schedule ?? study.schedule,
      location: apiExtra.location ?? study.location,
      startDate: apiExtra.startDate ?? study.startDate ?? undefined,
      endDate: apiExtra.endDate ?? study.endDate ?? undefined,
    };
    const productId = String(apiStudy._id ?? id);

    const ok = await updateStudyAPI(productId, { extra: mergedExtra }, accessToken);
    if (!ok) {
      // 실패 시 원래 상태로 롤백
      setStudy((prev) => (prev ? { ...prev, isClosed: !nextClosed } : prev));
      toast.error('모집 상태 변경에 실패했습니다.');
    } else {
      toast.success(nextClosed ? '모집을 마감했습니다.' : '모집을 다시 시작했습니다.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <ToastContainer position="top-right" />

      <main className={styles.main}>
        {/* 뒤로가기 */}
        <Link href="/" className={styles.backButton}>
          <FiArrowLeft size={16} />
          목록으로
        </Link>

        <div className={styles.grid}>
          {/* ── 왼쪽 ── */}
          <div className={styles.leftCol}>
            {/* 뱃지 */}
            <div>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${styles.statusBadgeClass}`}>{statusLabel}</span>
                {categoryLabel && <span className="badge badgeOutline">{categoryLabel}</span>}
              </div>

              {/* 제목 */}
              <h1 className={styles.studyTitle}>{study.title}</h1>

              {/* 호스트 */}
              <div className={styles.hostRow}>
                <div className={styles.avatar}>{(study.hostName || '스터디장').charAt(0)}</div>
                <div>
                  <p className={styles.hostName}>{study.hostName || '스터디장'}</p>
                  <p className={styles.hostRole}>스터디장</p>
                </div>
              </div>

              {/* 태그 + 북마크 */}
              <div className={styles.tagRow}>
                <div className={styles.tagList}>
                  {study.tags.map((tag) => (
                    <span key={tag} className={`${styles.badge} ${styles.badgeSecondary}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                {currentUser && (
                  <button className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ''}`} onClick={handleBookmark} disabled={isBookmarking || isBookmarked}>
                    <FiHeart className={`${styles.bookmarkIcon} ${isBookmarked ? styles.bookmarkIconFilled : ''}`} />
                  </button>
                )}
              </div>

              <p className={styles.description}>{study.description}</p>
            </div>

            {/* ── 탭 ── */}
            <div className={styles.tabWrapper}>
              <div className={`${styles.tabList} ${!isHost ? styles.tabList2col : ''}`}>
                {(['chat', 'map', ...(isHost ? ['manage'] : [])] as string[]).map((tab) => (
                  <button key={tab} className={`${styles.tabTrigger} ${activeTab === tab ? styles.tabTriggerActive : ''}`} onClick={() => setActiveTab(tab)}>
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
                <div className={styles.tabContent}>
                  <div className={styles.chatCard}>
                    {!canViewChat ? (
                      <div className={styles.chatLocked}>{currentUser ? '참여 승인 후 채팅을 이용할 수 있습니다.' : '채팅하려면 로그인 후 스터디에 참여해주세요.'}</div>
                    ) : (
                      <>
                        <div ref={scrollRef} className={styles.chatMessages}>
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
                          <div className={styles.chatInputRow}>
                            <input className={styles.chatInput} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="메시지를 입력하세요..." />
                            <button className={styles.chatSendBtn} onClick={handleSendMessage} disabled={!chatInput.trim()}>
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
                <div className={styles.tabContent}>
                  <StudyMap location={study.location} />
                </div>
              )}

              {/* 관리 탭 */}
              {isHost && activeTab === 'manage' && (
                <div className={styles.tabContent}>
                  <ParticipantManage study={study} updateParticipantStatus={() => {}} />
                </div>
              )}
            </div>
          </div>

          {/* ── 사이드바 ── */}
          <aside className={styles.aside}>
            {/* 스터디 정보 카드 */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <p className={styles.infoCardTitle}>스터디 정보</p>
              </div>
              <div className={styles.infoCardBody}>
                <div className={styles.infoRow}>
                  <FiUsers className={styles.infoIcon} />
                  <div>
                    <p className={styles.infoLabel}>모집 인원</p>
                    <p className={styles.infoValue}>
                      {study.currentMembers} / {study.maxMembers}명
                    </p>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <FiClock className={styles.infoIcon} />
                  <div>
                    <p className={styles.infoLabel}>일정</p>
                    <p className={styles.infoValue}>{study.schedule}</p>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <FiCalendar className={styles.infoIcon} />
                  <div>
                    <p className={styles.infoLabel}>기간</p>
                    <p className={styles.infoValue}>
                      {study.startDate && !Number.isNaN(new Date(study.startDate).getTime()) ? format(new Date(study.startDate), 'yyyy.MM.dd', { locale: ko }) : study.startDate || '-'}
                      {study.endDate && !Number.isNaN(new Date(study.endDate).getTime()) && ` - ${format(new Date(study.endDate), 'yyyy.MM.dd', { locale: ko })}`}
                      {study.endDate && Number.isNaN(new Date(study.endDate).getTime()) && ` - ${study.endDate}`}
                    </p>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <FiMapPin className={styles.infoIcon} />
                  <div>
                    <p className={styles.infoLabel}>장소</p>
                    <p className={styles.infoValue}>{study.location.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 참여 신청 / 신청 상태 버튼 */}
            {!isHost && !study.isClosed && (
              <>
                <button className={styles.btnPrimary} onClick={() => !hasApplied && setIsApplyDialogOpen(true)} disabled={hasApplied || isFull}>
                  <FiUserPlus size={16} />
                  {hasApplied ? '참여 승인중' : isFull ? '모집 마감' : '참여 신청하기'}
                </button>

                {/* 신청 완료 안내 */}
                {hasApplied && (
                  <div className={styles.appliedCard}>
                    <p className={styles.appliedText}>
                      참여 신청이 완료되었습니다.
                      <br />
                      스터디장의 승인을 기다려주세요.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 호스트 전용 버튼 */}
            {isHost && (
              <>
                <button className={study.isClosed ? `${styles.btnPrimary}` : `${styles.btnOutline}`} onClick={handleToggleClosed}>
                  {study.isClosed ? '모집 재개하기' : '모집 마감하기'}
                </button>
                <button className={styles.btnOutline} onClick={() => router.push(`/study/${study.id}/edit`)}>
                  <FiEdit2 size={15} />
                  스터디 수정
                </button>
                <button className={styles.btnDestructive} onClick={() => setIsDeleteDialogOpen(true)}>
                  <FiTrash2 size={15} />
                  스터디 삭제
                </button>
              </>
            )}
          </aside>
        </div>
      </main>

      {/* ── 참여 신청 다이얼로그 ── */}
      <dialog ref={applyDialogRef} className={styles.dialog} onClose={() => setIsApplyDialogOpen(false)}>
        <p className={styles.dialogTitle}>스터디 참여 신청</p>
        <p className={styles.dialogDesc}>스터디장에게 전달할 메시지를 작성해주세요.</p>
        <textarea className={styles.dialogTextarea} rows={4} placeholder="자기소개, 참여 동기 등을 적어주세요." value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
        <div className={styles.dialogFooter}>
          <button className={styles.dialogBtnOutline} onClick={() => setIsApplyDialogOpen(false)}>
            취소
          </button>
          <button className={styles.dialogBtnPrimary} onClick={handleApply} disabled={!applyMessage.trim()}>
            신청하기
          </button>
        </div>
      </dialog>

      {/* ── 삭제 확인 다이얼로그 ── */}
      <dialog ref={deleteDialogRef} className={styles.dialog} onClose={() => setIsDeleteDialogOpen(false)}>
        <p className={styles.dialogTitle}>스터디 삭제</p>
        <p className={styles.dialogDesc}>정말 이 스터디를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <div className={styles.dialogFooter}>
          <button className={styles.dialogBtnOutline} onClick={() => setIsDeleteDialogOpen(false)}>
            취소
          </button>
          <button className={styles.dialogBtnDestructive} onClick={handleDelete}>
            삭제
          </button>
        </div>
      </dialog>
    </div>
  );
}
