'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import KeywordInput from '@/components/KeywordInput';
import CategoryInput from '@/components/CategoryInput';
import RichTextEditor from '@/components/RichTextEditor';

const initialState = { error: null };

function SubmitButton({ label, pendingLabel }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" size="md" type="submit" disabled={pending} fullWidth>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export default function QuestionForm({
  action,
  setId,
  initialValues,
  submitLabel = '저장',
}) {
  const [state, formAction] = useFormState(
    async (_prev, formData) => (await action(formData)) ?? initialState,
    initialState,
  );

  return (
    <form
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <TextField
        label="제목"
        name="title"
        defaultValue={initialValues?.title ?? ''}
        maxLength={200}
        required
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-2)' }}>
          내용
        </span>
        <RichTextEditor
          name="content"
          setId={setId}
          initialValue={initialValues?.content ?? ''}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-2)' }}>
          카테고리
        </span>
        <CategoryInput initial={initialValues?.categories ?? []} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-2)' }}>
          키워드
        </span>
        <KeywordInput initial={initialValues?.keywords ?? []} />
      </div>

      {state?.error && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-red)',
            padding: 'var(--space-3)',
            background: 'var(--color-red-tint)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {state.error}
        </div>
      )}

      <SubmitButton label={submitLabel} pendingLabel="저장 중…" />
    </form>
  );
}
