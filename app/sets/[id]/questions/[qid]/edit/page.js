import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import QuestionForm from '@/components/QuestionForm';
import Card from '@/components/Card';
import { updateQuestion } from '@/lib/question-actions';

export default async function EditQuestionPage({ params }) {
  const { id, qid } = params;
  const supabase = createServerSupabase();
  const { data: questionData } = await supabase
    .from('questions')
    .select('id, title, content, keywords, question_categories ( categories ( id, name ) )')
    .eq('id', qid)
    .maybeSingle();

  if (!questionData) notFound();

  // 카테고리 구조 정규화
  const question = {
    ...questionData,
    categories: questionData.question_categories?.map(qc => qc.categories) ?? [],
  };

  const boundUpdate = updateQuestion.bind(null, id, qid);

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>문제 편집</h1>
      <Card padding="var(--space-5)">
        <QuestionForm
          action={boundUpdate}
          setId={id}
          initialValues={question}
          submitLabel="저장"
        />
      </Card>
    </>
  );
}
