'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Study, Participant, ChatMessage } from './types';
import type { User } from '@/types/user';
import { initialStudies, initialMessages } from './mock-data';
import { createStudyAPI } from './study-api';
import useUserStore from '@/zustand/userStore';

interface StudyContextType {
  currentUser: User | null;
  accessToken: string;
  setAccessToken: (token: string) => void;
  studies: Study[];
  messages: ChatMessage[];
  addStudy: (
    study: Omit<Study, 'id' | 'createdAt' | 'currentMembers' | 'participants'>,
  ) => Promise<void>;
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

  const [accessToken, setAccessToken] = useState('');
  const [studies, setStudies] = useState<Study[]>(initialStudies);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const addStudy = useCallback(
    async (
      studyData: Omit<
        Study,
        'id' | 'createdAt' | 'currentMembers' | 'participants'
      >,
    ) => {
      let id = `study-${Date.now()}`;

      if (accessToken) {
        const result = await createStudyAPI(studyData, accessToken);
        if (result) id = result.id;
      }

      const newStudy: Study = {
        ...studyData,
        id,
        createdAt: new Date().toISOString(),
        currentMembers: 1,
        participants: [],
      };
      setStudies((prev) => [newStudy, ...prev]);
    },
    [accessToken],
  );

  const updateStudy = useCallback((id: string, updates: Partial<Study>) => {
    setStudies((prev) =>
      prev.map((study) => (study.id === id ? { ...study, ...updates } : study)),
    );
  }, []);

  const deleteStudy = useCallback((id: string) => {
    setStudies((prev) => prev.filter((study) => study.id !== id));
  }, []);

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
