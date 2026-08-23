import { MotionConfig } from 'motion/react';
import AppShell from '@/components/AppShell';
import { createServerSupabase } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/profile';
import './globals.css';

export const metadata = {
  title: 'my-interview',
  description: '면접 준비용 개인 학습 앱',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F1218',
};

// Root layout does a Supabase session lookup → force dynamic to avoid
// static prerender of framework 404/500 error pages.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const supabase = createServerSupabase();
  const profile = await getCurrentProfile(supabase);

  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <MotionConfig reducedMotion="user">
          <AppShell profile={profile}>{children}</AppShell>
        </MotionConfig>
      </body>
    </html>
  );
}
