'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus, MessageCircle, Menu } from 'lucide-react';
import useUserStore from '@/zustand/userStore';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  const { user, resetUser, hasHydrated } = useUserStore();
  const router = useRouter();

  const handleLogout = () => {
    resetUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">StudyMate</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="relative text-sm font-medium text-foreground transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            스터디 찾기
          </Link>
          <Link
            href="/my-studies"
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            내 스터디
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!hasHydrated ? (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5">
                <Link href="/signup">회원가입</Link>
              </Button>
            </div>
          ) : user ? (
            <>
              <Button asChild size="sm" className="hidden sm:flex rounded-full px-5 gap-2">
                <Link href="/create">
                  <Plus className="h-4 w-4" />
                  스터디 만들기
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" className="sm:hidden rounded-full">
                <Link href="/create">
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
                <Link href="/chat">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
              <Link href="/mypage">
                <Avatar className="h-9 w-9 border-2 border-border cursor-pointer transition-transform hover:scale-105">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                로그아웃
              </Button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5">
                <Link href="/signup">회원가입</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-lg font-medium text-foreground py-2 border-b border-border"
                >
                  스터디 찾기
                </Link>
                <Link
                  href="/my-studies"
                  className="text-lg font-medium text-muted-foreground py-2 border-b border-border"
                >
                  내 스터디
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/create"
                      className="text-lg font-medium text-muted-foreground py-2 border-b border-border"
                    >
                      스터디 만들기
                    </Link>
                    <Link
                      href="/chat"
                      className="text-lg font-medium text-muted-foreground py-2 border-b border-border"
                    >
                      채팅
                    </Link>
                    <Link
                      href="/mypage"
                      className="text-lg font-medium text-muted-foreground py-2 border-b border-border"
                    >
                      마이페이지
                    </Link>
                    <Button variant="outline" onClick={handleLogout} className="mt-4">
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button asChild variant="outline">
                      <Link href="/login">로그인</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">회원가입</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
