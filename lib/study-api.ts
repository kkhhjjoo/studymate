import { API_URL, CLIENT_ID } from './user';
import type { Study } from './types';

type CreateStudyInput = Omit<Study, 'id' | 'createdAt' | 'currentMembers' | 'participants'>;

interface CreateStudyResponse {
  ok: 1;
  item: { _id: number };
}

export async function createStudyAPI(
  study: CreateStudyInput,
  accessToken: string,
): Promise<{ id: string } | null> {
  const body = {
    name: study.title,
    content: study.description,
    price: 0,
    quantity: study.maxMembers,
    shippingFees: 0,
    show: !study.isClosed,
    extra: {
      type: 'study',
      category: study.category,
      tags: study.tags,
      location: study.location,
      schedule: study.schedule,
      startDate: study.startDate,
      endDate: study.endDate ?? '',
      hostId: study.hostId,
      hostName: study.hostName,
      hostAvatar: study.hostAvatar ?? '',
      currentMembers: 1,
      participants: [],
    },
  };

  const res = await fetch(`${API_URL}/seller/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'client-id': CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data: CreateStudyResponse = await res.json();
  return { id: String(data.item._id) };
}
