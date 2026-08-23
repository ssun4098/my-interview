import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase-server';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import { PlusIcon, ChevronRightIcon } from '@/components/icons';

export default async function MySetsPage() {
  const supabase = createServerSupabase();
  const { data: sets } = await supabase
    .from('question_sets')
    .select('id, title, is_public, created_at')
    .order('created_at', { ascending: false });

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
                    <span className="muted" style={{ fontSize: 12 }}>
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
