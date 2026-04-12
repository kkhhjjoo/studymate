import StudyFilter from '@/app/components/StudyFilter/StudyFilter';
import React, { useState } from 'react';
import styles from './SideBar.module.css';

interface SideBarProps {
  filters?: Record<string, string>;
  onFilterChanges?: (key: string, value: string) => void;
}

const SideBar = ({ filters: controlledFilters, onFilterChanges: controlledOnFilterChange }: SideBarProps) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});

  const filters = controlledFilters ?? localFilters;
  const setFilters = controlledOnFilterChange
    ? (key: string, value: string) => controlledOnFilterChange(key, value)
    : (key: string, value: string) => setLocalFilters((prev) => ({ ...prev, [key]: value }));

  const onFilterChanges = (key: string, value: string) => {
    setFilters(key, value);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.filterCard}>
        <h2 className={styles.filterTitle}>필터</h2>
        <StudyFilter onFilterChanges={onFilterChanges} showCategory filterValues={filters} />
      </div>
    </aside>
  );
};

export default SideBar;
