'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { StudyCard } from '@/components/study-card';
import { StudyFilters } from '@/components/study-filters';
import { useStudy } from '@/lib/study-context';
import type { StudyCategory } from '@/lib/types';
import { BookOpen, TrendingUp, Users, Sparkles } from 'lucide-react';
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

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-foreground">새로운 스터디 모집중</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance leading-tight tracking-tight">
            함께 성장하는
            <br />
            스터디를 찾아보세요
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            관심 분야의 스터디에 참여하고, 함께 목표를 달성하세요.
            <br className="hidden sm:block" />
            지금 바로 시작해보세요.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
                <BookOpen className="h-5 w-5 text-background" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">{stats.total}</p>
                <p className="text-sm text-muted-foreground">전체 스터디</p>
              </div>
            </div>
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">{stats.open}</p>
                <p className="text-sm text-muted-foreground">모집중</p>
              </div>
            </div>
            <div className="group flex items-center gap-4 rounded-2xl bg-card p-5 border border-border transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">{stats.members}</p>
                <p className="text-sm text-muted-foreground">참여 인원</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          {/* Sidebar Filters */}
          <aside className="space-y-6">
            <div className="sticky top-24 rounded-2xl bg-card p-6 border border-border">
              <h2 className="font-semibold text-foreground mb-5 text-lg">필터</h2>
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

          {/* Study List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground text-lg">
                스터디 목록
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {filteredStudies.length}개
                </span>
              </h2>
            </div>

            {filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-5">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center leading-relaxed">
                  조건에 맞는 스터디가 없습니다.
                  <br />
                  필터를 조정하거나 새로운 스터디를 만들어보세요.
                </p>
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
