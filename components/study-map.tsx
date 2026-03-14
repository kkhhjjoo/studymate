'use client';

import { useEffect, useRef } from 'react';
import type { Study } from '@/lib/types';

type StudyLocation = Study['location'];

interface StudyMapProps {
  location: StudyLocation;
}

const SCRIPT_ID = 'kakao-maps-sdk';

// 위치 정보 없을 때 사용할 서울 중심 좌표 (서울시청)
const SEOUL_CENTER = { lat: 37.5666805, lng: 126.9784147, name: '서울' };

export function StudyMap({ location }: StudyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  const hasValidLocation =
    location &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number';

  const coords = hasValidLocation
    ? location
    : { ...SEOUL_CENTER, name: location?.name ? `${location.name} (서울)` : SEOUL_CENTER.name };

  useEffect(() => {
    if (!KAKAO_KEY || !mapContainerRef.current) return;

    const { lat, lng, name } = coords;

    const renderMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao?.maps || !mapContainerRef.current) return;

      const container = mapContainerRef.current;
      // 공식 예제와 동일: center, level 옵션으로 지도 생성
      const options = {
        center: new kakao.maps.LatLng(lat, lng),
        level: 3,
      };
      const map = new kakao.maps.Map(container, options);
      mapInstanceRef.current = map;

      const center = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position: center });
      marker.setMap(map);
      new kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;white-space:nowrap;">${name}</div>`,
      }).open(map, marker);

      // 탭 전환 시 컨테이너 크기 변경 시 지도 리사이즈
      resizeObserverRef.current?.disconnect();
      const resizeObserver = new ResizeObserver(() => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0 && mapInstanceRef.current) {
          kakao.maps.event.trigger(mapInstanceRef.current as any, 'resize');
        }
      });
      resizeObserver.observe(container);
      resizeObserverRef.current = resizeObserver;
    };

    const initMap = () => {
      requestAnimationFrame(() => {
        renderMap();
      });
    };

    // 이미 로드된 경우 바로 사용
    if ((window as any).kakao?.maps) {
      initMap();
      return () => {
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;
        mapInstanceRef.current = null;
      };
    }

    // 카카오 공식 예제처럼 스크립트 로드 (autoload 기본값 사용)
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => setTimeout(initMap, 0);
    if (existingScript) {
      existingScript.addEventListener('load', onLoad);
      return () => {
        existingScript.removeEventListener('load', onLoad);
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;
        mapInstanceRef.current = null;
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}`;
    script.addEventListener('load', onLoad);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [KAKAO_KEY, coords.lat, coords.lng, coords.name]);

  if (!KAKAO_KEY) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{location?.name ?? '장소'}</p>
        <div
          className="w-full rounded-xl border border-border bg-muted flex items-center justify-center"
          style={{ height: 320 }}
        >
          <p className="text-sm text-muted-foreground text-center px-4">
            지도를 표시하려면 환경 변수 <code className="bg-muted-foreground/10 px-1 rounded">NEXT_PUBLIC_KAKAO_MAP_API_KEY</code>를 설정해 주세요.
            <br />
            <span className="text-xs">.env.local 파일에 추가 후 서버를 재시작하세요.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {location?.name ?? '장소'}
        {!hasValidLocation && (
          <span className="text-muted-foreground/80 ml-1">(위치 정보 없음 · 서울 지도)</span>
        )}
      </p>
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl border border-border bg-muted"
        style={{ height: 320 }}
      />
    </div>
  );
}
