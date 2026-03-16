import StudyFilter from '@/app/components/StudyFilter/StudyFilter';
import React, { useState } from 'react';

interface SideBarProps {
  filters?: Record<string, string>;
  onFilterChanges?: (key: string, value: string) => void;
}

const SideBar = ({ filters: controlledFilters, onFilterChanges: controlledOnFilterChange }: SideBarProps) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});

  const filters = controlledFilters ?? localFilters;
  const setFilters = controlledOnFilterChange ? (key: string, value: string) => controlledOnFilterChange(key, value) : (key: string, value: string) => setLocalFilters((prev) => ({ ...prev, [key]: value }));

  const onFilterChanges = (key: string, value: string) => {
    setFilters(key, value);
  };

  return (
    <aside className="sidebar">
      <div className="filter-card">
        <h2 className="filter-title">필터</h2>
        <StudyFilter onFilterChanges={onFilterChanges} showCategory filterValues={filters} />
      </div>
    </aside>
  );
};

export default SideBar;
