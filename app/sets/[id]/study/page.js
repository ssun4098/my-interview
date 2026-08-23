import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getQuestionSetForStudy } from '@/lib/queries';
import StudyView from '@/components/StudyView';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default async function StudySetPage({ params, searchParams }) {
  const { id } = params;
  const mode = searchParams?.mode;
  const rawI = Number.parseInt(searchParams?.i ?? '0', 10);
  const initialIndex = Number.isFinite(rawI) && rawI >= 0 ? rawI : 0;

  if (mode !== 'study' && mode !== 'memorize') {
    redirect(`/sets/${id}`);
  }

  const supabase = createServerSupabase();
  const bundle = await getQuestionSetForStudy(supabase, id);
  if (!bundle) notFound();

  if (bundle.questions.length === 0) {
    return (
      <>
        <h1 style={{ marginBottom: 'var(--space-4)' }}>{bundle.set.title}</h1>
        <Card padding="var(--space-5)" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
            이 문제집에 아직 문제가 없습니다.
          </p>
          <Link href={`/sets/${id}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">문제집으로</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)', fontSize: 20 }}>
        {bundle.set.title}
      </h1>
      <StudyView
        questions={bundle.questions}
        mode={mode}
        initialIndex={initialIndex}
        backHref={`/sets/${id}`}
      />
    </>
  );
}
