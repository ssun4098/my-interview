import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase-server';
import Card from '@/components/Card';
import { ChevronRightIcon } from '@/components/icons';

export default async function PublicSetsPage() {
  const supabase = createServerSupabase();
  const { data: sets } = await supabase
    .from('question_sets')
    .select('id, title, created_at, owner:profiles ( username )')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>공개 문제집</h1>

      {!sets || sets.length === 0 ? (
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted">아직 공개된 문제집이 없습니다.</p>
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
                href={`/public-sets/${s.id}`}
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
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--color-fg-1)',
                      }}
                    >
                      {s.title}
                    </div>
                    <span className="muted" style={{ fontSize: 12 }}>
                      by {s.owner?.username ?? '알 수 없음'} ·{' '}
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
