'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Study, Participant, ChatMessage } from './types';
import type { User } from '@/types/user';
import { initialStudies, initialMessages } from './mock-data';
import { createStudyAPI, updateStudyAPI, deleteStudyAPI, fetchProductsAPI } from './study-api';
import useUserStore from '@/zustand/userStore';

interface StudyContextType {
  currentUser: User | null;
  accessToken: string;
  setAccessToken: (token: string) => void;
  studies: Study[];
  messages: ChatMessage[];
  addStudy: (
    study: Omit<Study, 'id' | 'createdAt' | 'currentMembers' | 'participants'>,
  ) => Promise<{ success: boolean; savedToApi: boolean; id: string }>;
  updateStudy: (id: string, updates: Partial<Study>) => void;
  deleteStudy: (id: string) => void;
  applyToStudy: (studyId: string, message: string) => void;
  updateParticipantStatus: (
    studyId: string,
    participantId: string,
    status: Participant['status'],
  ) => void;
  toggleStudyClosed: (studyId: string) => void;
  sendMessage: (studyId: string, content: string) => void;
  getStudyById: (id: string) => Study | undefined;
  getMessagesForStudy: (studyId: string) => ChatMessage[];
}

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const storeUser = useUserStore((state) => state.user);
  const currentUser: User | null = storeUser;

  const accessToken = storeUser?.token?.accessToken ?? '';
  const setAccessToken = () => {}; // kept for interface compatibility
  // 서버·클라이언트 첫 렌더를 동일하게 (하이드레이션 오류 방지)
  const [studies, setStudies] = useState<Study[]>(initialStudies);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // 마운트 후: 채팅은 localStorage 복원, 스터디는 localStorage 복원 후 API와 병합 (등록한 상품 유지)
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chat-messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
      const savedStudies = localStorage.getItem('studies');
      if (savedStudies) {
        const parsed = JSON.parse(savedStudies);
        if (Array.isArray(parsed) && parsed.length > 0) setStudies(parsed);
      }
    } catch {
      // ignore
    }

    fetchProductsAPI(accessToken).then((apiStudies) => {
      let local: Study[] = [];
      try {
        const s = localStorage.getItem('studies');
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) local = p;
        }
      } catch {
        // ignore
      }
      if (apiStudies.length > 0) {
        const apiIds = new Set(apiStudies.map((s) => s.id));
        const localOnly = local.filter((s) => !apiIds.has(s.id));
        setStudies([...apiStudies, ...localOnly]);
      } else if (local.length > 0) {
        setStudies(local);
      }
    });
  }, [accessToken]);

  useEffect(() => {
    localStorage.setItem('studies', JSON.stringify(studies));
  }, [studies]);

  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);

  const addStudy = useCallback(
    async (
      studyData: Omit<
        Study,
        'id' | 'createdAt' | 'currentMembers' | 'participants'
      >,
    ): Promise<{ success: boolean; savedToApi: boolean; id: string }> => {
      let id = `study-${Date.now()}`;
      let savedToApi = false;

      if (accessToken) {
        const result = await createStudyAPI(studyData, accessToken);
        if (result) {
          id = result.id;
          savedToApi = true;
          const apiStudies = await fetchProductsAPI(accessToken);
          setStudies(apiStudies);
          return { success: true, savedToApi: true, id };
        }
      }

      const newStudy: Study = {
        ...studyData,
        id,
        createdAt: new Date().toISOString(),
        currentMembers: 1,
        participants: [],
      };
      setStudies((prev) => [newStudy, ...prev]);
      return { success: true, savedToApi: false, id };
    },
    [accessToken],
  );

  const updateStudy = useCallback((id: string, updates: Partial<Study>) => {
    setStudies((prev) => {
      const updated = prev.map((study) => (study.id === id ? { ...study, ...updates } : study));
      if (accessToken) {
        const study = updated.find((s) => s.id === id);
        if (study) updateStudyAPI(id, study, accessToken);
      }
      return updated;
    });
  }, [accessToken]);

  const deleteStudy = useCallback((id: string) => {
    setStudies((prev) => prev.filter((study) => study.id !== id));
    if (accessToken) {
      deleteStudyAPI(id, accessToken);
    }
  }, [accessToken]);

  const applyToStudy = useCallback(
    (studyId: string, message: string) => {
      if (!currentUser) return;
      const participant: Participant = {
        id: `participant-${Date.now()}`,
        studyId,
        userId: currentUser._id,
        userName: currentUser.name,
        userAvatar: currentUser.image,
        status: 'pending',
        message,
        appliedAt: new Date().toISOString(),
      };

      setStudies((prev) =>
        prev.map((study) =>
          study.id === studyId
            ? { ...study, participants: [...study.participants, participant] }
            : study,
        ),
      );
    },
    [currentUser],
  );

  const updateParticipantStatus = useCallback(
    (studyId: string, participantId: string, status: Participant['status']) => {
      setStudies((prev) =>
        prev.map((study) => {
          if (study.id !== studyId) return study;

          const updatedParticipants = study.participants.map((p) =>
            p.id === participantId ? { ...p, status } : p,
          );

          const approvedCount = updatedParticipants.filter(
            (p) => p.status === 'approved',
          ).length;

          return {
            ...study,
            participants: updatedParticipants,
            currentMembers: 1 + approvedCount,
          };
        }),
      );
    },
    [],
  );

  const toggleStudyClosed = useCallback((studyId: string) => {
    setStudies((prev) =>
      prev.map((study) =>
        study.id === studyId ? { ...study, isClosed: !study.isClosed } : study,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    (studyId: string, content: string) => {
      if (!currentUser) return;
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        studyId,
        userId: currentUser._id,
        userName: currentUser.name,
        userAvatar: currentUser.image,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [currentUser],
  );

  const getStudyById = useCallback(
    (id: string) => studies.find((study) => study.id === id),
    [studies],
  );

  const getMessagesForStudy = useCallback(
    (studyId: string) => messages.filter((msg) => msg.studyId === studyId),
    [messages],
  );

  return (
    <StudyContext.Provider
      value={{
        currentUser,
        accessToken,
        setAccessToken,
        studies,
        messages,
        addStudy,
        updateStudy,
        deleteStudy,
        applyToStudy,
        updateParticipantStatus,
        toggleStudyClosed,
        sendMessage,
        getStudyById,
        getMessagesForStudy,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
