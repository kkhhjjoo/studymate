'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus, MessageCircle } from 'lucide-react';
import useUserStore from '@/zustand/userStore';

export function Header() {
  const { user, resetUser, hasHydrated } = useUserStore();
  const router = useRouter();

  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5 text-background" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">StudyMate</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-secondary"
          >
            스터디 찾기
          </Link>
          <Link
            href="/my-studies"
            className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-secondary"
          >
            내 스터디
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!hasHydrated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm" className="rounded-lg">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          ) : user ? (
            <>
              <Button asChild size="sm" className="hidden sm:flex rounded-lg gap-1.5">
                <Link href="/create">
                  <Plus className="h-4 w-4" />
                  스터디 만들기
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" className="sm:hidden rounded-lg">
                <Link href="/create">
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" className="rounded-lg">
                <Link href="/chat">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
              <Link href="/mypage">
                <Avatar className="h-9 w-9 border-2 border-border cursor-pointer transition-all hover:border-foreground/30">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-lg text-muted-foreground hover:text-foreground">
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm" className="rounded-lg">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
