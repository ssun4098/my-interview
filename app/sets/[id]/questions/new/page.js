import QuestionForm from '@/components/QuestionForm';
import Card from '@/components/Card';
import { createQuestion } from '@/lib/question-actions';

export default function NewQuestionPage({ params }) {
  const { id } = params;
  const boundCreate = createQuestion.bind(null, id);

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>새 문제</h1>
      <Card padding="var(--space-5)">
        <QuestionForm action={boundCreate} submitLabel="추가" />
      </Card>
    </>
  );
}
