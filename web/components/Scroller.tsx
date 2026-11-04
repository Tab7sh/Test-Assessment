'use client';

import { useEffect, useRef } from 'react';

interface Props {
  initialScroll?: number;
  onScroll?: (y: number) => void;
  children: React.ReactNode;
}

export default function Scroller({ initialScroll = 0, onScroll, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialScroll > 0 && containerRef.current) {
      containerRef.current.scrollTop = initialScroll;
    }
  }, [initialScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(e.currentTarget.scrollTop);
  };

  return (
    <div ref={containerRef} className="view-scroller" onScroll={handleScroll}>
      {children}
    </div>
  );
}
