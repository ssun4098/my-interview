'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-actions';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TextField from '@/components/TextField';

const initialState = { error: null };

async function action(_prev, formData) {
  const result = await signIn(formData);
  return result ?? initialState;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="mint" size="md" type="submit" disabled={pending} fullWidth>
      {pending ? '로그인 중…' : '로그인'}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(action, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/sets';
  const signedUp = searchParams.get('signedUp') === '1';
  const revoked = searchParams.get('revoked') === '1';

  return (
    <div style={{ maxWidth: 380, margin: '48px auto 0' }}>
      {signedUp && (
        <div
          role="status"
          style={{
            marginBottom: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-primary-tint)',
            color: 'var(--color-fg-1)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.
        </div>
      )}
      {revoked && (
        <div
          role="status"
          style={{
            marginBottom: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-fg-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          세션이 만료되었거나 계정이 비활성화되었습니다. 다시 로그인해 주세요.
        </div>
      )}

      <Card
        as="section"
        padding="var(--space-6)"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>로그인</h1>
          <p className="muted">아이디와 비밀번호를 입력해 주세요.</p>
        </div>

        <form
          action={formAction}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          <input type="hidden" name="next" value={next} />

          <TextField
            label="아이디"
            type="text"
            name="username"
            autoComplete="username"
            required
          />
          <TextField
            label="비밀번호"
            type="password"
            name="password"
            autoComplete="current-password"
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
          계정이 없나요?{' '}
          <Link href="/signup" style={{ color: 'var(--color-fg-1)', fontWeight: 600 }}>
            회원가입
          </Link>
        </div>
      </Card>
    </div>
  );
}
