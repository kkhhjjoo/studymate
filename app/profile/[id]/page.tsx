'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, MapPin, Calendar, Venus, Mars } from 'lucide-react';
import type { User as UserType } from '@/types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

interface ProfilePageProps {
  params: { id: string };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params;
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          headers: { 'Client-Id': CLIENT_ID! },
        });
        if (!res.ok) throw new Error('사용자를 찾을 수 없습니다.');
        const data = await res.json();
        setProfile(data.item);
      } catch (e) {
        setError(e instanceof Error ? e.message : '프로필을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  const genderLabel = profile?.gender === 'm' ? '남성' : profile?.gender === 'f' ? '여성' : '-';
  const ageLabel = profile?.age ? `${profile.age}세` : '-';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>

        {loading ? (
          <p className="text-center text-muted-foreground py-16">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-muted-foreground py-16">{error}</p>
        ) : profile ? (
          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={profile.image} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">지역</p>
                    <p className="font-medium text-foreground">{profile.region || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">나이</p>
                    <p className="font-medium text-foreground">{ageLabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">성별</p>
                    <p className="font-medium text-foreground">{genderLabel}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
