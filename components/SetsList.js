'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import { ChevronRightIcon, SearchIcon } from '@/components/icons';

export default function SetsList({ sets }) {
  const [query, setQuery] = useState('');

  const filteredSets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sets;
    return sets.filter((s) => s.title.toLowerCase().includes(trimmed));
  }, [sets, query]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-2)',
          background: 'var(--color-bg-surface)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <SearchIcon size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="문제집 제목 검색"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            color: 'inherit',
          }}
        />
      </div>

      {sets.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">아직 문제집이 없습니다.</p>
        </Card>
      ) : filteredSets.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">검색 결과가 없습니다.</p>
        </Card>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {filteredSets.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sets/${s.id}`}
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <Card
                  padding="var(--space-4)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--color-fg-1)',
                      }}
                    >
                      <span
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {s.title}
                      </span>
                      <Chip
                        label={s.is_public ? '공개' : '비공개'}
                        variant={s.is_public ? 'mint' : 'default'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 2 }}>
                      {s.categories && s.categories.length > 0 && (
                        s.categories.map(cat => (
                          <span
                            key={cat.id}
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--color-primary-tint)',
                              color: 'var(--color-primary)',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {cat.name}
                          </span>
                        ))
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {new Date(s.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <ChevronRightIcon size={18} />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
