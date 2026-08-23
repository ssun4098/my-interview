import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import Button from '@/components/Button';


export default async function PublicSetDetailPage({ params }) {
  const { id } = params;
  const supabase = createServerSupabase();

  const { data: set } = await supabase
    .from('question_sets')
    .select('id, title, is_public, owner:profiles ( username )')
    .eq('id', id)
    .maybeSingle();

  if (!set || !set.is_public) notFound();

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('question_set_id', id);

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{set.title}</h1>
      <p className="muted" style={{ marginBottom: 'var(--space-6)' }}>
        by {set.owner?.username ?? '알 수 없음'} · 문제 {count ?? 0}개
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Link
          href={`/public-sets/${id}/study?mode=study&i=0`}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="primary" size="md">학습 모드로 열기</Button>
        </Link>
        <Link
          href={`/public-sets/${id}/study?mode=memorize&i=0`}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="ghost" size="md">암기 모드로 열기</Button>
        </Link>
        <Link href="/public-sets" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="md">목록으로</Button>
        </Link>
      </div>
    </>
  );
}
