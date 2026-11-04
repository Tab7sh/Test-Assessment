'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  status: 'loading' | 'site' | 'nowhere' | 'about' | 'idle';
  onSubmit: (typed: string) => void;
}

export default function AddressBar({ value, status, onSubmit }: Props) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync with value whenever external location changes and input is not focused
  useEffect(() => {
    if (!focused) {
      setDraft(value);
    }
  }, [value, focused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      onSubmit(draft);
    } else if (e.key === 'Escape') {
      setDraft(value);
      e.currentTarget.blur();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    e.currentTarget.select();
  };

  const handleBlur = () => {
    setFocused(false);
    setDraft(value);
  };

  const badgeClass =
    status === 'loading'
      ? 'status-dot loading'
      : status === 'nowhere'
        ? 'status-dot error'
        : status === 'site'
          ? 'status-dot ok'
          : 'status-dot info';

  return (
    <div className={`address-bar ${focused ? 'focused' : ''}`}>
      <span className={badgeClass} title={`Status: ${status}`} />
      <input
        ref={inputRef}
        type="text"
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        value={draft}
        placeholder="Type an address (.zz) or search the small web..."
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
