'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useUserStore from '@/zustand/userStore';
import { useStudy } from '@/lib/study-context';
import { fetchBookmarksAPI } from '@/lib/bookmark-api';
import type { Study } from '@/lib/types';
import {
  Pencil,
  MapPin,
  ChevronDown,
  Users,
  Calendar,
  Bookmark as BookmarkIcon,
  ArrowRight,
  Heart,
  Activity,
  Crown,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

function formatAge(age: number | undefined): string {
  if (age == null) return '무관';
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대+';
}

export default function MypagePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { studies } = useStudy();
  const [bookmarks, setBookmarks] = useState<Study[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmark' | 'manage' | 'participated' | null>(null);
  const [bio, setBio] = useState('안녕하세요! 잘 부탁드려요!');

  const accessToken = user?.token?.accessToken ?? '';

  const bookmarkCount = bookmarks.length;
  const completedCount = user
    ? studies.filter(
        (s) =>
          s.hostId !== user._id &&
          s.participants.some(
            (p) => p.userId === user._id && p.status === 'approved'
          )
      ).length
    : 0;

  useEffect(() => {
    if (!accessToken) return;
    setBookmarkLoading(true);
    fetchBookmarksAPI(accessToken)
      .then(setBookmarks)
      .finally(() => setBookmarkLoading(false));
  }, [accessToken]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">
            마이페이지를 보려면{' '}
            <Link href="/login" className="text-primary underline">
              로그인
            </Link>
            해주세요.
          </p>
        </main>
      </div>
    );
  }

  const genderLabel = user.gender === 'f' ? '여' : user.gender === 'm' ? '남' : '-';
  const ageLabel = formatAge(user.age);
  const regionLabel = user.region || '-';

  const myHostStudies = studies.filter((s) => s.hostId === user._id);
  const myAppliedStudies = studies.filter(
    (s) =>
      s.hostId !== user._id &&
      s.participants.some((p) => p.userId === user._id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-xl font-bold text-foreground mb-6">마이 페이지</h1>

        {/* 프로필 카드 */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-5 mb-5 shadow-sm">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                aria-label="프로필 수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {genderLabel} | {ageLabel} | {regionLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary/80 shrink-0">
                  <Heart className="h-4 w-4 fill-primary/30" />
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">70 bpm</span>
                </div>
              </div>
              <textarea
                className="mt-3 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={2}
                placeholder="한줄 소개"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 관심 모임 / 참여 완료 */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-5 mb-5 flex">
          <div className="flex-1 text-center border-r border-border">
            <p className="text-sm text-muted-foreground">관심 모임</p>
            <p className="text-2xl font-bold text-foreground mt-1">{bookmarkCount}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm text-muted-foreground">참여 완료</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completedCount}</p>
          </div>
        </div>

        {/* 버튼 3개 */}
        <div className="flex gap-3 mb-8">
          <Button
            variant={activeTab === 'bookmark' ? 'default' : 'secondary'}
            className={
              activeTab === 'bookmark'
                ? 'flex-1 bg-primary/90 hover:bg-primary text-primary-foreground'
                : 'flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }
            onClick={() => setActiveTab('bookmark')}
          >
            북마크
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'secondary' : 'outline'}
            className={
              activeTab === 'manage'
                ? 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }
            onClick={() => setActiveTab('manage')}
          >
            관리하기
          </Button>
          <Button
            variant={activeTab === 'participated' ? 'secondary' : 'outline'}
            className={
              activeTab === 'participated'
                ? 'flex-1 bg-sky-200 hover:bg-sky-300 text-sky-800'
                : 'flex-1 bg-sky-100 hover:bg-sky-200 text-sky-800'
            }
            onClick={() => setActiveTab('participated')}
          >
            참여 모임
          </Button>
        </div>

        {/* 북마크 섹션 */}
        {activeTab === 'bookmark' && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">북마크</h2>
            {bookmarkLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                북마크 목록 불러오는 중...
              </p>
            ) : bookmarks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center rounded-xl bg-muted/30">
                저장한 북마크가 없습니다.
              </p>
            ) : (
              <>
                <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/30">
                  {bookmarks.map((study) => (
                    <BookmarkCard key={study.id} study={study} />
                  ))}
                </div>
                <div className="flex justify-center gap-1.5 mt-4">
                  {bookmarks.slice(0, 6).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* 관리하기: 내가 만든 스터디 */}
        {activeTab === 'manage' && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              내가 만든 스터디
              <span className="text-sm font-normal text-muted-foreground">
                ({myHostStudies.length})
              </span>
            </h2>
            {myHostStudies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">아직 만든 스터디가 없습니다.</p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/create">스터디 만들기</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myHostStudies.map((study) => (
                  <StudyItem
                    key={study.id}
                    study={study}
                    role="host"
                    currentUserId={user._id}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 참여 모임: 신청한 스터디 */}
        {activeTab === 'participated' && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              신청한 스터디
              <span className="text-sm font-normal text-muted-foreground">
                ({myAppliedStudies.length})
              </span>
            </h2>
            {myAppliedStudies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">신청한 스터디가 없습니다.</p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/">스터디 찾기</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myAppliedStudies.map((study) => (
                  <StudyItem
                    key={study.id}
                    study={study}
                    role="participant"
                    currentUserId={user._id}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function StudyItem({
  study,
  role,
  currentUserId,
}: {
  study: Study;
  role: 'host' | 'participant';
  currentUserId: string;
}) {
  const isFull = study.currentMembers >= study.maxMembers;
  const myParticipant = study.participants.find((p) => p.userId === currentUserId);

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={study.isClosed ? 'secondary' : isFull ? 'outline' : 'default'}>
            {study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중'}
          </Badge>
          <Badge variant="outline">{study.category}</Badge>
          {role === 'host' ? (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
              <Crown className="h-3 w-3 mr-1" />
              스터디장
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={
                myParticipant?.status === 'approved'
                  ? 'border-green-500 text-green-600'
                  : myParticipant?.status === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-amber-500 text-amber-600'
              }
            >
              {myParticipant?.status === 'approved'
                ? '승인됨'
                : myParticipant?.status === 'rejected'
                  ? '거절됨'
                  : '대기중'}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-foreground mt-1">{study.title}</h3>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{study.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-secondary">
              {(study.hostName || '스터디장').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{study.hostName || '스터디장'}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {study.currentMembers}/{study.maxMembers}
          </span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/study/${study.id}`}>자세히 보기</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function BookmarkCard({ study }: { study: Study }) {
  const router = useRouter();
  const safeDate =
    study.startDate && !Number.isNaN(new Date(study.startDate).getTime())
      ? format(new Date(study.startDate), 'yyyy-MM-dd', { locale: ko })
      : study.startDate || '-';

  return (
    <button
      type="button"
      onClick={() => router.push(`/study/${study.id}`)}
      className="shrink-0 w-[280px] snap-start rounded-xl border border-primary/20 bg-[#C7D2FE]/40 hover:bg-[#C7D2FE]/60 shadow-sm p-4 text-left transition-colors flex flex-col"
    >
      <div className="flex justify-end mb-2">
        <BookmarkIcon className="h-5 w-5 fill-primary text-primary" />
      </div>
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
          {/* 상품 이미지가 있으면 표시 가능 */}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
            {study.title}
          </h3>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{study.location?.name ?? '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              <span>20대, 무관</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>인원 {study.maxMembers}명</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{safeDate}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </button>
  );
}
