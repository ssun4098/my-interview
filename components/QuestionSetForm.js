'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import CategoryInput from '@/components/CategoryInput';

const initialState = { error: null };

function SubmitButton({ label, pendingLabel }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" size="md" type="submit" disabled={pending} fullWidth>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export default function QuestionSetForm({
  action,
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

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          fontSize: 14,
          color: 'var(--color-fg-1)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={initialValues?.is_public ?? false}
          style={{
            width: 16,
            height: 16,
            accentColor: 'var(--color-primary)',
          }}
        />
        공개 문제집 (다른 로그인 사용자도 볼 수 있음)
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-2)' }}>
          카테고리
        </span>
        <CategoryInput initial={initialValues?.categories ?? []} />
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
