'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** 레거시 경로: 상세는 `/study/[id]`로 통일 */
export default function StudiesIdRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (id) router.replace(`/study/${id}`);
  }, [params?.id, router]);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>스터디 페이지로 이동 중입니다…</p>
    </main>
  );
}
