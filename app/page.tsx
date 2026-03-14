'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { StudyCard } from '@/components/study-card';
import { StudyFilters } from '@/components/study-filters';
import { useStudy } from '@/lib/study-context';
import type { StudyCategory } from '@/lib/types';
import { BookOpen, TrendingUp, Users } from 'lucide-react';
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
        <section className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
            함께 성장하는 스터디를 찾아보세요
          </h1>
          <p className="text-muted-foreground text-lg">
            관심 분야의 스터디에 참여하고, 함께 목표를 달성하세요.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">전체 스터디</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                <p className="text-xs text-muted-foreground">모집중</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.members}</p>
                <p className="text-xs text-muted-foreground">참여 인원</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-xl bg-card p-5 border border-border">
              <h2 className="font-semibold text-foreground mb-4">필터</h2>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                스터디 목록
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {filteredStudies.length}개
                </span>
              </h2>
            </div>

            {filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  조건에 맞는 스터디가 없습니다.
                  <br />
                  필터를 조정하거나 새로운 스터디를 만들어보세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
