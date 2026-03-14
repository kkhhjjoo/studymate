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
import { Calendar, MapPin, Users, MessageCircle, User, Heart, ArrowRight } from 'lucide-react';
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
      className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-card border-border/50 overflow-hidden"
      onClick={() => router.push(`/study/${study.id}`)}
    >
      <CardHeader className="pb-3 relative">
        {/* Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant={study.isClosed ? 'secondary' : isFull ? 'outline' : 'default'}
                className={
                  study.isClosed
                    ? 'bg-muted text-muted-foreground border-0'
                    : isFull
                    ? 'border-amber-400 text-amber-700 bg-amber-50'
                    : 'bg-primary text-primary-foreground border-0'
                }
              >
                {study.isClosed ? '모집 마감' : isFull ? '인원 마감' : '모집중'}
              </Badge>
              <Badge variant="outline" className="text-xs border-border/70 text-muted-foreground">
                {study.category}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {study.title}
            </h3>
          </div>
          {accessToken && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-50 -mt-1 -mr-2"
              onClick={handleBookmark}
              disabled={isBookmarking || isBookmarked}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {study.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {study.tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs font-normal bg-secondary/70 text-secondary-foreground border-0 rounded-full px-2.5"
            >
              {tag}
            </Badge>
          ))}
          {study.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs font-normal bg-secondary/70 text-secondary-foreground border-0 rounded-full px-2.5">
              +{study.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">
              {study.schedule ||
                (study.startDate && !Number.isNaN(new Date(study.startDate).getTime())
                  ? format(new Date(study.startDate), 'yyyy.MM.dd', { locale: ko })
                  : study.startDate) ||
                '-'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">{study.location.name}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/50 bg-secondary/20">
        <div className="flex w-full items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2.5 rounded-full px-2 py-1 hover:bg-secondary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {(study.hostName || '스터디장').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground font-medium">{study.hostName || '스터디장'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-44 p-2 border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-muted-foreground hover:text-foreground"
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
                  className="justify-start gap-2 text-muted-foreground hover:text-foreground"
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className={isFull ? 'text-amber-600 font-semibold' : 'text-muted-foreground font-medium'}>
                {study.currentMembers}/{study.maxMembers}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
