import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import QuestionForm from '@/components/QuestionForm';
import Card from '@/components/Card';
import { updateQuestion } from '@/lib/question-actions';

export default async function EditQuestionPage({ params }) {
  const { id, qid } = params;
  const supabase = createServerSupabase();
  const { data: question } = await supabase
    .from('questions')
    .select('id, title, content, keywords')
    .eq('id', qid)
    .maybeSingle();

  if (!question) notFound();

  const boundUpdate = updateQuestion.bind(null, id, qid);

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>문제 편집</h1>
      <Card padding="var(--space-5)">
        <QuestionForm
          action={boundUpdate}
          initialValues={question}
          submitLabel="저장"
        />
      </Card>
    </>
  );
}
