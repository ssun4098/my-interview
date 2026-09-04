import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase-server';
import Button from '@/components/Button';
import SetsList from '@/components/SetsList';
import { PlusIcon } from '@/components/icons';

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

      <SetsList sets={sets} />
    </>
  );
}
