'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { StudyCard } from '@/components/study-card';
import { StudyFilters } from '@/components/study-filters';
import { useStudy } from '@/lib/study-context';
import type { StudyCategory } from '@/lib/types';
import { BookOpen, TrendingUp, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HomePage() {
  const { studies, accessToken } = useStudy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StudyCategory | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showClosed, setShowClosed] = useState(false);

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      if (!showClosed && study.isClosed) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          study.title.toLowerCase().includes(query) ||
          study.description.toLowerCase().includes(query) ||
          study.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      if (selectedCategory && study.category !== selectedCategory) return false;

      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some((tag) => study.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [studies, searchQuery, selectedCategory, selectedTags, showClosed]);

  const stats = useMemo(() => {
    const openStudies = studies.filter((s) => !s.isClosed);
    const totalMembers = studies.reduce((acc, s) => acc + s.currentMembers, 0);
    return {
      total: studies.length,
      open: openStudies.length,
      members: totalMembers,
    };
  }, [studies]);

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary">
          <div className="absolute inset-0 bg-[url('/images/hero-study.jpg')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          
          <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  함께하면 더 강해지는 학습
                </span>
              </div>
              <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                함께 성장하는
                <br />
                <span className="text-primary">스터디</span>를 찾아보세요
              </h1>
              <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                관심 분야의 스터디에 참여하고, 같은 목표를 가진 동료들과 함께 성장하세요.
                혼자보다 함께할 때 더 멀리 갈 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="group" asChild>
                  <Link href="/create">
                    스터디 만들기
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#studies">
                    스터디 둘러보기
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative hidden md:flex items-center justify-center">
              <div className="relative h-80 w-full overflow-hidden rounded-2xl shadow-2xl shadow-primary/20">
                <Image
                  src="/images/hero-study.jpg"
                  alt="Students studying together"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-card p-4 shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">활발한 커뮤니티</p>
                    <p className="text-xs text-muted-foreground">{stats.members}+ 참여 인원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">전체 스터디</p>
              </div>
            </div>
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 transition-colors group-hover:bg-accent/30">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.open}</p>
                <p className="text-sm text-muted-foreground">모집중인 스터디</p>
              </div>
            </div>
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all hover:border-secondary-foreground/30 hover:shadow-lg hover:shadow-secondary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-secondary/80">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.members}</p>
                <p className="text-sm text-muted-foreground">참여 인원</p>
              </div>
            </div>
          </div>
        </section>

        <div id="studies" className="grid gap-8 lg:grid-cols-[280px_1fr] scroll-mt-8">
          <aside className="space-y-6">
            <div className="sticky top-24 rounded-2xl bg-card p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-1 rounded-full bg-primary" />
                <h2 className="font-semibold text-foreground text-lg">필터</h2>
              </div>
              <StudyFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                showClosed={showClosed}
                onShowClosedChange={setShowClosed}
              />
            </div>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  스터디 목록
                </h2>
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {filteredStudies.length}개
                </span>
              </div>
            </div>

            {filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-5">
                  <BookOpen className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">조건에 맞는 스터디가 없습니다</p>
                <p className="text-muted-foreground text-center">
                  필터를 조정하거나 새로운 스터디를 만들어보세요.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/create">
                    스터디 만들기
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredStudies.map((study) => (
                  <StudyCard key={study.id} study={study} accessToken={accessToken} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
