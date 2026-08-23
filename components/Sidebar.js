/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from '@/lib/auth-actions';
import { SPRING, useIsMobile } from '@/lib/motion';
import Button from '@/components/Button';
import {
  BookIcon,
  UsersIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons';

const NAV = [
  { href: '/sets', label: '내 문제집', Icon: BookIcon, match: (p) => p === '/sets' || p.startsWith('/sets/') },
  { href: '/public-sets', label: '공개 문제집', Icon: UsersIcon, match: (p) => p === '/public-sets' || p.startsWith('/public-sets/') },
  { href: '/profile', label: '프로필', Icon: UserIcon, match: (p) => p === '/profile' || p.startsWith('/profile/') },
];

function NavItem({ href, label, Icon, active, collapsed, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '10px 12px',
        margin: '2px 8px',
        borderRadius: 'var(--radius-md)',
        background: active ? 'var(--color-primary-tint)' : 'transparent',
        color: active ? 'var(--color-fg-1)' : 'var(--color-fg-3)',
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            bottom: 8,
            width: 2,
            borderRadius: 2,
            background: 'var(--color-primary)',
          }}
        />
      )}
      <Icon size={20} filled={active} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export default function Sidebar({
  profile,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // Delay motion-driven x animation until after mount so CSS controls the
  // initial paint (mobile default = translateX(-100%), desktop = 0).
  // Otherwise motion would set an inline transform on first paint before
  // isMobile resolves, causing the drawer to briefly flash open on mobile.
  useEffect(() => {
    setMounted(true);
  }, []);

  // On mobile, drive x with motion spring based on mobileOpen state.
  // On desktop, pin x to 0 (CSS handles the width transition for collapse).
  // Before mount, animate={false} → motion does not touch inline style.
  const asideAnimate = !mounted
    ? false
    : isMobile
      ? { x: mobileOpen ? 0 : '-100%' }
      : { x: 0 };

  return (
    <>
      {/* Mobile top bar (hamburger + title) */}
      <div
        className="mobile-topbar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--mobile-topbar-h)',
          display: 'none',
          alignItems: 'center',
          gap: 12,
          padding: '0 var(--space-3)',
          background: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-1)',
          zIndex: 30,
        }}
      >
        <button
          type="button"
          onClick={onMobileOpen}
          aria-label="메뉴 열기"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            padding: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-fg-1)',
          }}
        >
          <MenuIcon size={20} />
        </button>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-fg-1)',
            letterSpacing: '-0.01em',
          }}
        >
          <img src="/favicon.svg" width={22} height={22} alt="" />
          my-interview
        </Link>
      </div>

      {/* Backdrop — motion fade */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-backdrop"
            onClick={onMobileClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 45,
              display: 'block',
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — motion spring drawer on mobile; CSS handles desktop width transition.
          `animate={false}` before mount lets CSS drive the initial paint so the mobile
          drawer doesn't flash open before isMobile resolves. */}
      <motion.aside
        className="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        data-mobile-open={mobileOpen ? 'true' : 'false'}
        initial={false}
        animate={asideAnimate}
        transition={SPRING.sheet}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border-1)',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 8,
            padding: collapsed ? '14px 8px' : '14px 12px',
            minHeight: 52,
            borderBottom: '1px solid var(--color-border-1)',
          }}
        >
          {!collapsed && (
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--color-fg-1)',
                letterSpacing: '-0.01em',
              }}
            >
              <img src="/favicon.svg" width={22} height={22} alt="" />
              my-interview
            </Link>
          )}
          {collapsed && <img src="/favicon.svg" width={22} height={22} alt="my-interview" />}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="sidebar-desktop-toggle"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              padding: 0,
              background: 'transparent',
              border: '1px solid var(--color-border-2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-fg-3)',
            }}
          >
            {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="메뉴 닫기"
            className="sidebar-mobile-close"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-fg-2)',
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {NAV.map(({ href, label, Icon, match }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={match(pathname)}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>

        {/* Footer */}
        {profile && (
          <div
            style={{
              borderTop: '1px solid var(--color-border-1)',
              padding: collapsed ? '10px 8px' : '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {!collapsed && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-fg-3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile.username}
              </div>
            )}
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                fullWidth
                title={collapsed ? '로그아웃' : undefined}
                style={{
                  gap: collapsed ? 0 : 8,
                  padding: collapsed ? 0 : undefined,
                }}
              >
                <LogOutIcon size={14} />
                {!collapsed && '로그아웃'}
              </Button>
            </form>
          </div>
        )}
      </motion.aside>
    </>
  );
}
