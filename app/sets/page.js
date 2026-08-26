import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase-server';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import { PlusIcon, ChevronRightIcon } from '@/components/icons';

export default async function MySetsPage() {
  const supabase = createServerSupabase();
  const { data: setsData } = await supabase
    .from('question_sets')
    .select('id, title, is_public, created_at, question_set_categories ( categories ( id, name ) )')
    .order('created_at', { ascending: false });

  // 카테고리 구조 정규화
  const sets = setsData?.map(s => ({
    ...s,
    categories: s.question_set_categories?.map(qsc => qsc.categories) ?? [],
  })) ?? [];

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-3)',
        }}
      >
        <h1>내 문제집</h1>
        <Link href="/sets/new" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">
            <PlusIcon size={14} />
            새 문제집
          </Button>
        </Link>
      </div>

      {!sets || sets.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">아직 문제집이 없습니다.</p>
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
          {sets.map((s) => (
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
