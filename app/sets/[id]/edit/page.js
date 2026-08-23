import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import QuestionSetForm from '@/components/QuestionSetForm';
import Card from '@/components/Card';
import { updateSet } from '@/lib/set-actions';

export default async function EditSetPage({ params }) {
  const { id } = params;
  const supabase = createServerSupabase();
  const { data: set } = await supabase
    .from('question_sets')
    .select('id, title, is_public')
    .eq('id', id)
    .maybeSingle();

  if (!set) notFound();

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
