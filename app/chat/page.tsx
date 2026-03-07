'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStudy } from '@/lib/study-context';
import useUserStore from '@/zustand/userStore';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const { studies, getMessagesForStudy } = useStudy();
  const user = useUserStore((state) => state.user);

  // 내가 호스트이거나 참여 신청한 스터디만 표시
  const myStudies = studies.filter((study) =>
    study.hostId === user?._id ||
    study.participants.some((p) => p.userId === user?._id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          채팅
        </h1>

        {!user ? (
          <p className="text-center text-muted-foreground py-16">
            채팅 목록을 보려면{' '}
            <a href="/login" className="text-primary underline">로그인</a>
            해주세요.
          </p>
        ) : myStudies.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            참여 중인 스터디가 없습니다.
          </p>
        ) : (
        <div className="flex flex-col gap-3">
          {myStudies.map((study) => {
            const msgs = getMessagesForStudy(study.id);
            const lastMsg = msgs[msgs.length - 1];

            return (
              <Link key={study.id} href={`/study/${study.id}?tab=chat`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {study.hostName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground truncate">{study.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {study.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMsg ? `${lastMsg.userName}: ${lastMsg.content}` : '메시지가 없습니다.'}
                      </p>
                    </div>
                    {msgs.length > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {msgs.length}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}
