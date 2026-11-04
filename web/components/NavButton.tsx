'use client';

import { useEffect, useRef, useState } from 'react';
import { locToString } from '@/lib/location';
import type { Entry } from '@/lib/session';

interface Props {
  direction: 'back' | 'forward';
  disabled: boolean;
  entries: Entry[];
  onClick: () => void;
  onJump: (index: number) => void;
}

export default function NavButton({ direction, disabled, entries, onClick, onJump }: Props) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isBack = direction === 'back';
  const label = isBack ? 'Back' : 'Forward';
  const symbol = isBack ? '←' : '→';

  // Close popup if clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMouseDown = () => {
    if (disabled || entries.length === 0) return;
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, 450);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (entries.length > 0 && !disabled) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="nav-button-container" ref={containerRef}>
      <button
        className="icon-btn"
        disabled={disabled}
        title={`${label}${entries.length > 0 ? ' (hold or right click for history)' : ''}`}
        aria-label={label}
        onClick={() => {
          if (!open) onClick();
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {symbol}
      </button>

      {open && entries.length > 0 && (
        <div className={`nav-menu ${isBack ? 'left' : 'right'}`}>
          <div className="nav-menu-header">{isBack ? 'Earlier pages' : 'Next pages'}</div>
          {entries.map((entry, idx) => {
            const locStr = locToString(entry.loc);
            const title = entry.title || locStr;
            return (
              <button
                key={entry.key || idx}
                className="nav-menu-item"
                onClick={() => {
                  setOpen(false);
                  onJump(idx);
                }}
              >
                <span className="nav-menu-title">{title}</span>
                <span className="nav-menu-url">{locStr}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
