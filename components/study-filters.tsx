'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { STUDY_CATEGORIES, POPULAR_TAGS, type StudyCategory } from '@/lib/types';
import { Search, X } from 'lucide-react';

interface StudyFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: StudyCategory | null;
  onCategoryChange: (category: StudyCategory | null) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  showClosed: boolean;
  onShowClosedChange: (show: boolean) => void;
}

export function StudyFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagsChange,
  showClosed,
  onShowClosedChange,
}: StudyFiltersProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange(null);
    onTagsChange([]);
    onShowClosedChange(false);
  };

  const hasActiveFilters =
    searchQuery || selectedCategory || selectedTags.length > 0 || showClosed;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="스터디 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl h-11 border-border bg-background focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">카테고리</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="mr-1 h-3 w-3" />
              초기화
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className="h-9 rounded-full px-4"
          >
            전체
          </Button>
          {STUDY_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className="h-9 rounded-full px-4"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-foreground">인기 태그</span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.slice(0, 12).map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className={`cursor-pointer transition-all rounded-full px-3 py-1.5 text-xs font-normal ${
                selectedTags.includes(tag) 
                  ? 'bg-foreground text-background hover:bg-foreground/90' 
                  : 'hover:bg-secondary'
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant={showClosed ? 'default' : 'outline'}
          size="sm"
          onClick={() => onShowClosedChange(!showClosed)}
          className="h-9 rounded-full px-4"
        >
          마감된 스터디 포함
        </Button>
      </div>
    </div>
  );
}
