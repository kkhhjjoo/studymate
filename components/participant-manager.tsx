'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStudy } from '@/lib/study-context';
import type { Study, Participant } from '@/lib/types';
import { Check, X, Clock, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ParticipantManagerProps {
  study: Study;
}

export function ParticipantManager({ study }: ParticipantManagerProps) {
  const { updateParticipantStatus } = useStudy();

  const pendingParticipants = study.participants.filter((p) => p.status === 'pending');
  const approvedParticipants = study.participants.filter((p) => p.status === 'approved');
  const rejectedParticipants = study.participants.filter((p) => p.status === 'rejected');

  const handleApprove = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'approved');
  };

  const handleReject = (participantId: string) => {
    updateParticipantStatus(study.id, participantId, 'rejected');
  };

  const ParticipantCard = ({
    participant,
    showActions,
  }: {
    participant: Participant;
    showActions?: boolean;
  }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-background text-foreground">
          {participant.userName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground">{participant.userName}</span>
          {participant.status === 'approved' && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-600 bg-green-50">
              승인됨
            </Badge>
          )}
          {participant.status === 'rejected' && (
            <Badge variant="outline" className="text-xs border-red-500 text-red-600 bg-red-50">
              거절됨
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {participant.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(participant.appliedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
        </p>
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 border-green-500 text-green-600 hover:bg-green-50"
            onClick={() => handleApprove(participant.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 border-red-500 text-red-600 hover:bg-red-50"
            onClick={() => handleReject(participant.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            대기 중인 신청
            <Badge variant="secondary" className="ml-auto">
              {pendingParticipants.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingParticipants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              대기 중인 신청이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-500" />
            승인된 멤버
            <Badge variant="secondary" className="ml-auto">
              {approvedParticipants.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedParticipants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              승인된 멤버가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {approvedParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rejectedParticipants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              거절된 신청
              <Badge variant="secondary" className="ml-auto">
                {rejectedParticipants.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
