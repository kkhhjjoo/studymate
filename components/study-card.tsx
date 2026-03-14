'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { Study } from '@/lib/types';
import { addBookmarkAPI } from '@/lib/bookmark-api';
import { Calendar, MapPin, Users, MessageCircle, User, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface StudyCardProps {
  study: Study;
  accessToken?: string;
}

export function StudyCard({ study, accessToken }: StudyCardProps) {
  const router = useRouter();
  const isFull = study.currentMembers >= study.maxMembers;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken || isBookmarking || isBookmarked) return;
    setIsBookmarking(true);
    const ok = await addBookmarkAPI(study.id, accessToken);
    setIsBookmarking(false);
    if (ok) {
      setIsBookmarked(true);
      toast.success('북마크에 추가되었습니다.');
    } else {
      toast.error('북마크 추가에 실패했습니다.');
    }
  };

  return (
    <Card
      className="group h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer"
      onClick={() => router.push(`/study/${study.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
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
              <Badge variant="outline" className="text-xs">
                {study.category}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {study.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {study.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {study.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
          {study.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs font-normal">
              +{study.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {study.schedule ||
                (study.startDate && !Number.isNaN(new Date(study.startDate).getTime())
                  ? format(new Date(study.startDate), 'yyyy.MM.dd', { locale: ko })
                  : study.startDate) ||
                '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{study.location.name}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {accessToken && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                onClick={handleBookmark}
                disabled={isBookmarking || isBookmarked}
              >
                <Heart
                  className={`h-4 w-4 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            )}
            <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-secondary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                    {(study.hostName || '스터디장').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{study.hostName || '스터디장'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-40 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/study/${study.id}?tab=chat`);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  채팅하기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${study.hostId}`);
                  }}
                >
                  <User className="h-4 w-4" />
                  프로필 보기
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className={isFull ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
              {study.currentMembers}/{study.maxMembers}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
