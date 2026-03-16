'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/app/components/Header/Header';
import useUserStore from '@/zustand/userStore';
import { fetchProductsAPI } from '@/lib/study';
import type { Study } from '@/types/studies';
import { ParticipantManager } from '@/app/components/participant-manager';
