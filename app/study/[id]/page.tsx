'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useUserStore from '@/zustand/userStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStudy } from '@/lib/study-context';
import { ParticipantManager } from '@/components/participant-manager';
import { StudyMap } from '@/components/study-map';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  MessageCircle,
  Settings,
  UserPlus,
  Send,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StudyDetailPageProps {
  params: { id: string };
}

export default function StudyDetailPage({ params }: StudyDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getStudyById, applyToStudy, toggleStudyClosed, deleteStudy, currentUser, sendMessage, getMessagesForStudy } = useStudy();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const storeUser = useUserStore((state) => state.user);
  const study = getStudyById(id);

  const [applyMessage, setApplyMessage] = useState('');
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultTab = searchParams.get('tab') ?? 'chat';
  const messages = study ? getMessagesForStudy(study.id) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !study) return;
    sendMessage(study.id, chatInput.trim());
    setChatInput('');
  };

  if (!study) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            스터디를 찾을 수 없습니다
          </h1>
          <Button asChild>
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </main>
      </div>
    );
  }

  const isHost = currentUser ? study.hostId === currentUser._id : false;
  const hasApplied = currentUser ? study.participants.some((p) => p.userId === currentUser._id) : false;
  const isFull = study.currentMembers >= study.maxMembers;
  const canApply = !isHost && !hasApplied && !study.isClosed && !isFull;

  const handleApply = () => {
    if (applyMessage.trim()) {
      applyToStudy(study.id, applyMessage.trim());
      setApplyMessage('');
      setIsApplyDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant={study.isClosed ? 'secondary' : isFull ? 'outline' : 'default'}
                  className={
                    study.isClosed
                      ? 'bg-muted text-muted-foreground'
                      : isFull
                      ? 'border-amber-500 text-amber-600 bg-amber-50'
                      : ''
                  }
                >
                  {study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중'}
                </Badge>
                <Badge variant="outline">{study.category}</Badge>
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4 text-balance">
                {study.title}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {study.hostName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{study.hostName}</p>
                  <p className="text-sm text-muted-foreground">스터디장</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {study.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {study.description}
              </p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  채팅
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  위치
                </TabsTrigger>
                {isHost && (
                  <TabsTrigger value="manage" className="gap-2">
                    <Settings className="h-4 w-4" />
                    관리
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <Card>
                  <CardContent className="p-4 flex flex-col gap-3">
                    {/* 메시지 목록 */}
                    <div
                      ref={scrollRef}
                      className="h-72 overflow-y-auto flex flex-col gap-3 pr-1"
                    >
                      {messages.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground mt-8">
                          첫 메시지를 보내보세요!
                        </p>
                      ) : (
                        messages.map((msg) => {
                          const isMine = storeUser?._id === msg.userId;
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-xs bg-secondary">
                                  {msg.userName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMine ? 'items-end' : ''}`}>
                                <span className="text-xs text-muted-foreground">{msg.userName}</span>
                                <div
                                  className={`rounded-2xl px-3 py-2 text-sm ${
                                    isMine
                                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                                      : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* 입력창 */}
                    {storeUser ? (
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="메시지를 입력하세요..."
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        채팅하려면{' '}
                        <a href="/login" className="text-primary underline">로그인</a>
                        {' '}해주세요.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <StudyMap location={study.location} />
              </TabsContent>

              {isHost && (
                <TabsContent value="manage" className="mt-4">
                  <ParticipantManager study={study} />
                </TabsContent>
              )}
            </Tabs>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">스터디 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">모집 인원</p>
                    <p className="text-sm text-muted-foreground">
                      {study.currentMembers} / {study.maxMembers}명
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">일정</p>
                    <p className="text-sm text-muted-foreground">{study.schedule}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">기간</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(study.startDate), 'yyyy.MM.dd', { locale: ko })}
                      {study.endDate &&
                        ` - ${format(new Date(study.endDate), 'yyyy.MM.dd', { locale: ko })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">장소</p>
                    <p className="text-sm text-muted-foreground">{study.location.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {canApply && (
              <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <UserPlus className="mr-2 h-4 w-4" />
                    참여 신청하기
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>스터디 참여 신청</DialogTitle>
                    <DialogDescription>
                      스터디장에게 전달할 메시지를 작성해주세요.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="자기소개, 참여 동기 등을 적어주세요."
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleApply} disabled={!applyMessage.trim()}>
                      신청하기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {hasApplied && !isHost && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-primary font-medium">
                    참여 신청이 완료되었습니다.
                    <br />
                    스터디장의 승인을 기다려주세요.
                  </p>
                </CardContent>
              </Card>
            )}

            {isHost && (
              <>
                <Button
                  variant={study.isClosed ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => toggleStudyClosed(study.id)}
                >
                  {study.isClosed ? '모집 재개하기' : '모집 마감하기'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/study/${study.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  스터디 수정
                </Button>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      스터디 삭제
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>스터디 삭제</DialogTitle>
                      <DialogDescription>
                        정말 이 스터디를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        취소
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deleteStudy(study.id);
                          router.push('/');
                        }}
                      >
                        삭제
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
