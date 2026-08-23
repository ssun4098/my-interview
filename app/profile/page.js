import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/profile';
import { signOut } from '@/lib/auth-actions';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const profile = await getCurrentProfile(supabase);

  if (!profile) redirect('/login');

  return (
    <>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>프로필</h1>

      <Card
        padding="var(--space-5)"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-fg-3)',
              marginBottom: 4,
            }}
          >
            아이디
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-fg-1)',
            }}
          >
            {profile.username}
          </div>
        </div>

        <form action={signOut}>
          <Button variant="ghost" size="md" type="submit" fullWidth>
            로그아웃
          </Button>
        </form>
      </Card>
    </>
  );
}
