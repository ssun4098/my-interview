'use client';

import { useState } from 'react';
import Chip from '@/components/Chip';

function normalizeAndAdd(current, raw) {
  const parts = raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set(current.map((k) => k.toLowerCase()));
  const next = [...current];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      next.push(part);
      seen.add(key);
    }
  }
  return next;
}

export default function KeywordInput({ initial = [], name = 'keywords' }) {
  const [chips, setChips] = useState(initial);
  const [buffer, setBuffer] = useState('');

  function commitBuffer(next = buffer) {
    if (!next) return;
    setChips((prev) => normalizeAndAdd(prev, next));
    setBuffer('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitBuffer();
    } else if (e.key === 'Backspace' && buffer === '' && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  }

  function handleChange(e) {
    const v = e.target.value;
    if (v.includes(',')) {
      commitBuffer(v);
    } else {
      setBuffer(v);
    }
  }

  function removeChip(i) {
    setChips((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {chips.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          {chips.map((chip, i) => (
            <Chip
              key={`${chip}-${i}`}
              label={chip}
              variant="primary"
              onRemove={() => removeChip(i)}
            />
          ))}
        </div>
      )}
      <input
        type="text"
        value={buffer}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => commitBuffer()}
        placeholder="키워드 입력 후 콤마 또는 엔터"
        style={{
          width: '100%',
          height: 40,
          padding: '0 var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-2)',
          outline: 'none',
          fontFamily: 'inherit',
          color: 'var(--color-fg-1)',
        }}
      />
      <input type="hidden" name={name} value={JSON.stringify(chips)} />
    </div>
  );
}
