import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import QuestionSetForm from '@/components/QuestionSetForm';
import Card from '@/components/Card';
import { updateSet } from '@/lib/set-actions';

export default async function EditSetPage({ params }) {
  const { id } = params;
  const supabase = createServerSupabase();
  const { data: setData } = await supabase
    .from('question_sets')
    .select('id, title, is_public, question_set_categories ( categories ( id, name ) )')
    .eq('id', id)
    .maybeSingle();

  if (!setData) notFound();

  // 카테고리 구조 정규화
  const set = {
    ...setData,
    categories: setData.question_set_categories?.map(qsc => qsc.categories) ?? [],
  };

  const boundUpdate = updateSet.bind(null, id);

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>문제집 편집</h1>
      <Card padding="var(--space-5)">
        <QuestionSetForm
          action={boundUpdate}
          initialValues={set}
          submitLabel="저장"
        />
      </Card>
    </>
  );
}
