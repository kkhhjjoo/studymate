'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus, MessageCircle } from 'lucide-react';
import useUserStore from '@/zustand/userStore';

export function Header() {
  const { user, resetUser } = useUserStore();
  const router = useRouter();

  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">StudyMate</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            스터디 찾기
          </Link>
          <Link
            href="/my-studies"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            내 스터디
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:flex">
                <Link href="/create">
                  <Plus className="mr-1 h-4 w-4" />
                  스터디 만들기
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" className="sm:hidden">
                <Link href="/create">
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost">
                <Link href="/chat">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
