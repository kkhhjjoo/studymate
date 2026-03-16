'use client';

import styles from './page.module.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IoIosTrendingUp } from 'react-icons/io';
import { LuUsers } from 'react-icons/lu';
import Header from '@/app/components/Header';
import SideBar from '@/app/components/SideBar';
import StudyCard from '@/app/components/StudyCard';
import { fetchProductsAPI } from '@/lib/study';
import useUserStore from '@/zustand/userStore';
import type { Study } from '@/types/studies';
import { useMemo, useState, useEffect } from 'react';

export default function Home() {
  const accessToken = useUserStore((s) => s.user?.token?.accessToken ?? '');
  const [studies, setStudies] = useState<Study[]>([]);

  useEffect(() => {
    let ignore = false;
    fetchProductsAPI(accessToken).then((result) => {
      if (ignore) return;
      if (Array.isArray(result)) setStudies(result);
      else setStudies([]);
    });
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  const [filters, setFilters] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const openStudies = studies.filter((s) => !s.extra?.isClosed);
    const members = studies.reduce((acc, s) => acc + (s.extra?.participant?.length ?? 0), 0);
    return {
      total: studies.length,
      open: openStudies.length,
      members,
    };
  }, [studies]);

  const filteredStudies = useMemo(() => {
    let list = studies;
    const recruitment = filters.recruitmentStatus;
    if (recruitment === 'open') list = list.filter((s) => !s.extra?.isClosed);
    else if (recruitment === 'closed') list = list.filter((s) => s.extra?.isClosed === true);
    if (filters.tag) list = list.filter((s) => s.extra?.tags?.includes(filters.tag));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.content?.toLowerCase().includes(q) ||
        s.extra?.category?.toLowerCase().includes(q) ||
        s.extra?.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [studies, filters.recruitmentStatus, filters.tag, filters.search]);
  return (
    <>
      <Header onSearch={(q) => setFilters((prev) => ({ ...prev, search: q }))} />
      <main className="main">
        <section className="hero">
          <h1 className="hero-title">함께 성장하는 스터디를 찾아보세요.</h1>
          <p className="hero-description">관심 분야의 스터디에 참여하고, 함께 목표를 달성하세요.</p>
          <div className="grid">
            <div className="stat-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 7v14"></path>
                  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
              </div>
              <div>
                <p className="stat-number">{stats.total}</p>
                <p className="stat-label">전체 스터디</p>
              </div>
            </div>

          <div className="stat-card">
            <div className="icon">
              <IoIosTrendingUp />
            </div>
            <div>
              <p className="stat-number">{stats.open}</p>
              <p className="stat-label">모집중</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="icon">
              <LuUsers />
            </div>
            <div>
              <p className="stat-number">{stats.members}</p>
              <p className="stat-label">참여 인원</p>
            </div>
          </div>
        </div>
        </section>

        <div className="layout">
          <SideBar
            filters={filters}
            onFilterChanges={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          />
          <section className="content">
          <div className="content-header">
            <h2>
              스터디 목록 <span className="study-count">{filteredStudies.length}개</span>
            </h2>
          </div>

          {filteredStudies.length === 0 ? (
            <div className="empty-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 7v14"></path>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
              </svg>
              <p>
                조건에 맞는 스터디가 없습니다. <br />
                필터를 조정하거나 새로운 스터디를 만들어보세요.
              </p>
            </div>
          ) : (
            <div className="grid">
              {filteredStudies.map((study) => (
                <StudyCard key={study.seller_id ?? study._id ?? study.name} study={study} accessToken={accessToken || undefined} />
              ))}
            </div>
          )}
          </section>
        </div>
      </main>
    </>
  );
}
