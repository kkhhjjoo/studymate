'use client';

import { useEffect, useRef } from 'react';
import type { Study } from '@/lib/types';

type StudyLocation = Study['location'];

interface StudyMapProps {
  location: StudyLocation;
}

export function StudyMap({ location }: StudyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const { lat, lng, name } = location;
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!mapContainerRef.current || !KAKAO_KEY) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="//dapi.kakao.com/v2/maps/sdk.js"]',
    );

    const onLoadKakaoMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) return;

      kakao.maps.load(() => {
        const center = new kakao.maps.LatLng(lat, lng);

        const map = new kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 4,
        });

        const marker = new kakao.maps.Marker({
          position: center,
        });
        marker.setMap(map);

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:8px 12px;font-size:13px;">${name}</div>`,
        });
        infoWindow.open(map, marker);
      });
    };

    if (existingScript) {
      if ((window as any).kakao && (window as any).kakao.maps) {
        onLoadKakaoMap();
      } else {
        existingScript.addEventListener('load', onLoadKakaoMap);
      }
      return () => {
        existingScript.removeEventListener('load', onLoadKakaoMap);
      };
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.addEventListener('load', onLoadKakaoMap);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoadKakaoMap);
    };
  }, [location]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{location.name}</p>
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl border border-border bg-muted"
        style={{ height: 320 }}
      />
    </div>
  );
}

