'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useStudy } from '@/lib/study-context';
import useUserStore from '@/zustand/userStore';
import { BookOpen, Users, Crown } from 'lucide-react';

export default function MyStudiesPage() {
  const { studies } = useStudy();
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">
            내 스터디를 보려면{' '}
            <a href="/login" className="text-primary underline">로그인</a>
            해주세요.
          </p>
        </main>
      </div>
    );
  }

  const myHostStudies = studies.filter((s) => s.hostId === user._id);
  const myAppliedStudies = studies.filter(
    (s) =>
      s.hostId !== user._id &&
      s.participants.some((p) => p.userId === user._id)
  );

  const StudyItem = ({ study, role }: { study: typeof studies[0]; role: 'host' | 'participant' }) => {
    const isFull = study.currentMembers >= study.maxMembers;
    const myParticipant = study.participants.find((p) => p.userId === user._id);

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
              <AvatarFallback className="text-xs bg-secondary">{study.hostName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{study.hostName}</span>
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">내 스터디</h1>

        {/* 내가 만든 스터디 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            내가 만든 스터디
            <span className="text-sm font-normal text-muted-foreground">({myHostStudies.length})</span>
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
                <StudyItem key={study.id} study={study} role="host" />
              ))}
            </div>
          )}
        </section>

        {/* 신청한 스터디 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            신청한 스터디
            <span className="text-sm font-normal text-muted-foreground">({myAppliedStudies.length})</span>
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
                <StudyItem key={study.id} study={study} role="participant" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
