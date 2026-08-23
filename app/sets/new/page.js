import QuestionSetForm from '@/components/QuestionSetForm';
import Card from '@/components/Card';
import { createSet } from '@/lib/set-actions';

export default function NewSetPage() {
  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>새 문제집</h1>
      <Card padding="var(--space-5)">
        <QuestionSetForm action={createSet} submitLabel="만들기" />
      </Card>
    </>
  );
}
