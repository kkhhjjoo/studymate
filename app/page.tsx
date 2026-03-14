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

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-secondary/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,90,61,0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span>함께 성장하는 학습 커뮤니티</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4 leading-tight text-balance">
              스터디로 만드는
              <br />
              <span className="text-primary">성장의 여정</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              관심 분야의 스터디에 참여하고, 함께 목표를 달성하세요. 
              새로운 사람들과 지식을 나누며 성장하는 경험을 시작하세요.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl">
            <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">전체 스터디</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.open}</p>
                <p className="text-sm text-muted-foreground">모집중</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.members}</p>
                <p className="text-sm text-muted-foreground">참여 인원</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Filters */}
          <aside className="space-y-6">
            <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-sm border border-border/50">
              <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                필터
              </h2>
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
              <h2 className="text-xl font-semibold text-foreground">
                스터디 목록
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  {filteredStudies.length}개
                </span>
              </h2>
            </div>

            {filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
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
