import React from 'react';
import type { StudyLocation } from '@/types/studies';

interface StudyMapProps {
  location?: StudyLocation;
}

const StudyMap = ({ location }: StudyMapProps) => {
  return <div>{location?.name}</div>;
};

export default StudyMap;
