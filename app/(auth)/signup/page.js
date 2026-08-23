'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { signUp } from '@/lib/auth-actions';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TextField from '@/components/TextField';

const initialState = { error: null };

async function action(_prev, formData) {
  const result = await signUp(formData);
  return result ?? initialState;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="mint" size="md" type="submit" disabled={pending} fullWidth>
      {pending ? '가입 중…' : '가입하기'}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div style={{ maxWidth: 380, margin: '48px auto 0' }}>
      <Card
        as="section"
        padding="var(--space-6)"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>회원가입</h1>
          <p className="muted">아이디와 비밀번호로 계정을 만듭니다.</p>
        </div>

        <form
          action={formAction}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          <TextField
            label="아이디"
            type="text"
            name="username"
            autoComplete="username"
            required
            placeholder="예: alice"
          />
          <TextField
            label="비밀번호 (8자 이상)"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

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

          <SubmitButton />
        </form>

        <div style={{ fontSize: 13, color: 'var(--color-fg-3)', textAlign: 'center' }}>
          이미 계정이 있나요?{' '}
          <Link href="/login" style={{ color: 'var(--color-fg-1)', fontWeight: 600 }}>
            로그인
          </Link>
        </div>
      </Card>
    </div>
  );
}
