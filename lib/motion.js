'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Spring presets. Values chosen to feel like iOS system spring at the "page"
 * level, slightly softer for sheets, and snappy for micro interactions.
 */
export const SPRING = {
  page:  { type: 'spring', stiffness: 350, damping: 32, mass: 0.8 },
  sheet: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
  micro: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
};

/**
 * Fallback for reduced-motion or popstate-driven transitions where we want
 * to defer to the browser's own animation.
 */
export const INSTANT = { duration: 0 };

/**
 * Returns 'forward' | 'back' | 'sibling' based on pathname depth comparison
 * across navigations. Detects browser back/forward via popstate.
 *
 * Semantics:
 *   - Deeper path (more segments)  → 'forward'
 *   - Shallower path (fewer segs)  → 'back'
 *   - Same depth (sibling route)   → 'sibling'
 *   - popstate event (any dir)     → 'back' (safe default matching iOS Safari)
 *
 * First render returns 'forward' (initial mount treated as entering).
 */
export function useRouteDirection() {
  const pathname = usePathname();
  const prevRef = useRef(pathname);
  const popstateRef = useRef(false);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    const onPop = () => {
      popstateRef.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === pathname) return;

    if (popstateRef.current) {
      setDirection('back');
      popstateRef.current = false;
    } else {
      const prevDepth = prev.split('/').filter(Boolean).length;
      const nextDepth = pathname.split('/').filter(Boolean).length;
      if (nextDepth > prevDepth) setDirection('forward');
      else if (nextDepth < prevDepth) setDirection('back');
      else setDirection('sibling');
    }
    prevRef.current = pathname;
  }, [pathname]);

  return direction;
}

/**
 * Mobile viewport detection via matchMedia.
 * Returns null on first server render, boolean afterwards.
 */
export function useIsMobile(query = '(max-width: 640px)') {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
