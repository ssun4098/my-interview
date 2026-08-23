'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const AUTH_PATHS = new Set(['/login', '/signup']);
const STUDY_RE = /^\/(sets|public-sets)\/[^/]+\/study(\/|$)/;

export default function AppShell({ profile, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isAuth = AUTH_PATHS.has(pathname);
  const isStudy = STUDY_RE.test(pathname);
  const showSidebar = Boolean(profile) && !isAuth && !isStudy;

  return (
    <div className={showSidebar ? 'app-layout with-sidebar' : 'app-layout no-sidebar'}
         data-sidebar-collapsed={collapsed ? 'true' : 'false'}
         style={{ minHeight: '100dvh' }}>
      {showSidebar && (
        <Sidebar
          profile={profile}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileOpen={() => setMobileOpen(true)}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}

      <main
        className="app-main"
        style={{
          minHeight: '100dvh',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
