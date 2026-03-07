'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStudy } from '@/lib/study-context';
import { STUDY_CATEGORIES, POPULAR_TAGS } from '@/lib/types';
import { ArrowLeft, MapPin, X } from 'lucide-react';
import Link from 'next/link';

const LOCATIONS = [
  { name: '강남역 스터디카페', lat: 37.4979, lng: 127.0276 },
  { name: '판교 카페', lat: 37.395, lng: 127.1116 },
  { name: '홍대 작업실', lat: 37.5563, lng: 126.9239 },
  { name: '역삼역 스터디룸', lat: 37.5006, lng: 127.0366 },
  { name: '선릉역 카페', lat: 37.5045, lng: 127.0498 },
  { name: '온라인', lat: 37.5665, lng: 126.978 },
];

export default function CreateStudyPage() {
  const router = useRouter();
  const { addStudy, currentUser } = useStudy();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [maxMembers, setMaxMembers] = useState('6');
  const [locationIndex, setLocationIndex] = useState('');
  const [schedule, setSchedule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !locationIndex || !schedule || !startDate) {
      return;
    }

    const location = LOCATIONS[parseInt(locationIndex)];

    await addStudy({
      title,
      description,
      category,
      tags: selectedTags,
      maxMembers: parseInt(maxMembers),
      hostId: currentUser._id,
      hostName: currentUser.name,
      hostAvatar: currentUser.image,
      location,
      schedule,
      startDate,
      endDate: endDate || undefined,
      isClosed: false,
    });

    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">새 스터디 만들기</CardTitle>
            <CardDescription>
              스터디 정보를 입력하고 함께 공부할 멤버를 모집하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">스터디 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: React 심화 스터디"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">스터디 소개 *</Label>
                <Textarea
                  id="description"
                  placeholder="스터디 목표, 진행 방식, 대상 등을 자세히 적어주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">모집 인원 *</Label>
                  <Select value={maxMembers} onValueChange={setMaxMembers}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}명
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>태그 (최대 5개)</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="default" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_TAGS.filter((tag) => !selectedTags.includes(tag))
                    .slice(0, 10)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="직접 입력"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCustomTag}>
                    추가
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">장소 *</Label>
                <Select value={locationIndex} onValueChange={setLocationIndex} required>
                  <SelectTrigger>
                    <SelectValue placeholder="장소 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">일정 *</Label>
                <Input
                  id="schedule"
                  placeholder="예: 매주 토요일 14:00 - 17:00"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">��료일 (선택)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" asChild>
                  <Link href="/">취소</Link>
                </Button>
                <Button type="submit" className="flex-1">
                  스터디 만들기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
