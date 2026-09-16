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
  const fallbackIndex = Number.isFinite(rawI) && rawI >= 0 ? rawI : 0;
  // ?q=<questionId> 로 특정 문제부터 시작합니다. 순서(order)는 드래그로 바뀔 수
  // 있어서 인덱스 대신 id 로 받고, 여기서 현재 순서 기준 위치를 찾습니다.
  // 지워진 문제를 가리키면 ?i= 값(기본 0)으로 되돌아갑니다.
  const startQuestionId = searchParams?.q;

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

  const requestedIndex = startQuestionId
    ? bundle.questions.findIndex((q) => q.id === startQuestionId)
    : -1;
  const initialIndex = requestedIndex >= 0 ? requestedIndex : fallbackIndex;

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
