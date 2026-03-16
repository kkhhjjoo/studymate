'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import Header from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';

export default function MypageEditPage() {
  const { user, setUser, hasHydrated } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace('/login');
    }
  }, [hasHydrated, user, router]);

  const [preview, setPreview] = useState<string | null>(user?.image ?? null);
  const [fileName, setFileName] = useState('');

  if (!user) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (preview && user) {
      setUser({ ...user, image: preview });
    }
    router.push('/mypage');
  };

  return (
    <>
      <Header />
      <main className="mypageMain">
        <h1 className="mypageTitle">프로필 수정</h1>

        <form onSubmit={handleSubmit} className="editProfileForm">
          <section className="editProfileSection">
            <h2 className="sectionTitle">프로필 이미지</h2>
            <div className="editAvatarRow">
              <div className="editAvatarPreview">
                {preview ? (
                  <Image src={preview} alt="프로필 미리보기" width={80} height={80} />
                ) : (
                  <div className="editAvatarPlaceholder">{user.name.charAt(0)}</div>
                )}
              </div>
              <label className="editAvatarUpload">
                <span>이미지 선택</span>
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
              </label>
              {fileName && <p className="editAvatarFileName">{fileName}</p>}
            </div>
          </section>

          <div className="editProfileActions">
            <button type="button" className="btnOutline" onClick={() => router.back()}>
              취소
            </button>
            <button type="submit" className="btnPrimary">
              저장하기
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

