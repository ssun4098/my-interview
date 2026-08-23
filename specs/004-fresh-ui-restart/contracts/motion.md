# Contract: Motion System (004)

`motion` (formerly framer-motion) 라이브러리를 사용한 UI 모션 계약. 컴포넌트는 이 문서의 프리셋만 참조해야 하며, 자체 spring stiffness 값을 하드코딩하면 안 된다.

---

## 1. 스프링 프리셋 (`lib/motion.js`)

```js
export const SPRING = {
  page:  { type: 'spring', stiffness: 350, damping: 32, mass: 0.8 },
  sheet: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
  micro: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
};

// Reduced-motion fallback (motion 라이브러리 useReducedMotion과 함께 사용)
export const INSTANT = { duration: 0 };
```

`SPRING.page` 값(350/32/0.8)은 iOS 시스템 spring에 시각적으로 가까운 조합. 세밀 튜닝은 이 값에서 damping ±2 범위 내로만.

---

## 2. 라우트 방향 감지 (`lib/motion.js`)

```js
'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';

/**
 * Returns 'forward' | 'back' | 'sibling' based on pathname depth comparison
 * across navigations. First render returns 'forward'.
 */
export function useRouteDirection() {
  const pathname = usePathname();
  const prevRef = useRef(pathname);
  const [direction, setDirection] = useState('forward');
  const popstateRef = useRef(false);

  useEffect(() => {
    const onPop = () => { popstateRef.current = true; };
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
```

**Note**: 이 hook은 `PageTransition` 안에서만 사용. Direction은 다음 라우팅 시점에 업데이트되므로 mount 순간엔 이전 값이 사용됨 — 이는 의도적 (React commit 순서에 부합).

---

## 3. PageTransition (`components/PageTransition.js`)

`app/template.js`에서 아래처럼 사용:

```jsx
// app/template.js
import PageTransition from '@/components/PageTransition';
export default function Template({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
```

`PageTransition.js` 요약:

```jsx
'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useRouteDirection } from '@/lib/motion';
import { SPRING } from '@/lib/motion';

const desktopVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const mobileVariants = (dir, reduce) => {
  if (reduce) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  if (dir === 'back') {
    return {
      initial: { x: '-30%', opacity: 0.6 },
      animate: { x: 0, opacity: 1 },
      exit:    { x: '100%', opacity: 0.6 },
    };
  }
  if (dir === 'sibling') {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  }
  return {  // 'forward'
    initial: { x: '100%', opacity: 0.6 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: '-30%', opacity: 0.6 },
  };
};

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const direction = useRouteDirection();
  const reduce = useReducedMotion();
  // Desktop 감지는 CSS 미디어 쿼리 대신 window 폭 hook 또는 CSS 클래스로.
  // Simpler: 모바일에서 방향성, 데스크톱에서 fade — 두 세트를 스타일별 컴포넌트로 두거나 useMediaQuery.
  // (구현 세부: useMediaQuery('(max-width: 640px)')로 분기)
  ...
}
```

전체 구현은 tasks에서 상세.

---

## 4. Sidebar mobile drawer

기존 CSS transition을 `motion.aside`로 교체:

```jsx
<motion.aside
  initial={false}
  animate={{ x: mobileOpen ? 0 : '-100%' }}
  transition={SPRING.sheet}
/>
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      className="sidebar-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

Desktop collapse는 CSS transition 유지(width 애니메이션은 layout thrashing 유발 가능하므로 그대로).

---

## 5. StudyView card transition

이전/다음 direction state 추가:

```jsx
const [direction, setDirection] = useState(1);  // 1=forward, -1=back
const goNext = () => { setDirection(1); setIndex(i => i + 1); };
const goPrev = () => { setDirection(-1); setIndex(i => i - 1); };
```

카드 래퍼:

```jsx
<AnimatePresence mode="popLayout" custom={direction}>
  <motion.div
    key={question.id}
    custom={direction}
    variants={{
      enter:  (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:   (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
    }}
    initial="enter" animate="center" exit="exit"
    transition={SPRING.page}
  >
    ...
  </motion.div>
</AnimatePresence>
```

40px 이동 폭은 카드가 작은 화면에서도 방향성이 인지되면서 잔여 이미지 겹침이 심하지 않은 값.

---

## 6. Button press feedback

Button 컴포넌트가 `whileTap` 활용:

```jsx
<motion.button whileTap={{ scale: 0.97 }} transition={SPRING.micro} ...>
```

Hover/focus는 CSS로 그대로.

---

## 7. Sheet (신규 컴포넌트)

모바일 하단 시트. 이번 스펙에서 필수 사용은 없으나 인프라 준비:

```jsx
<AnimatePresence>
  {open && (
    <>
      <motion.div className="sheet-backdrop" ... />
      <motion.div
        className="sheet"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={SPRING.sheet}
        drag="y" dragConstraints={{ top: 0 }} onDragEnd={handleDragClose}
      >
        ...
      </motion.div>
    </>
  )}
</AnimatePresence>
```

`drag="y"` + `onDragEnd` 조합으로 스와이프 다운 닫기 지원. 상단 라운드는 CSS `border-radius: var(--radius-sheet) var(--radius-sheet) 0 0`.

---

## 8. Reduced-motion 처리

최상위 `MotionConfig`에 조건부 적용:

```jsx
// app/layout.js (또는 AppShell.js 최상단)
import { MotionConfig } from 'motion/react';

<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

`reducedMotion="user"`는 브라우저 `prefers-reduced-motion: reduce` 값을 존중해 자동으로 spring을 짧은 duration으로 대체. 개별 컴포넌트에서 `useReducedMotion()` hook으로도 확인 가능.

---

## 9. iOS Safari 스와이프 뒤로 가기 충돌 방지

- `popstate` 이벤트 감지는 `useRouteDirection` hook 안에 포함.
- 감지 시 다음 라우트 변경의 direction을 'back'으로 강제하여 iOS의 native slide와 우리 애니메이션 방향이 일치 → 이중 이동감 없음.
- 방향은 일치하지만 지속시간이 겹칠 수 있음: `useReducedMotion`이 아닌 상황에서도 popstate로 판정되면 `PageTransition` transition 지속시간을 짧게 축소(예: SPRING.page 대신 duration 0.15s ease-out) — 이는 세밀 튜닝 tasks 단계에서.

---

## 10. Motion Registry (전체 요약)

| # | 위치 | Trigger | 프리셋 |
|---|------|---------|--------|
| 1 | PageTransition (mobile) | 라우트 변경 (forward/back) | `SPRING.page` + direction variants |
| 2 | PageTransition (desktop) | 라우트 변경 | 간단 fade + 6px 슬라이드 (spring 아님) |
| 3 | Sidebar drawer (mobile) | 햄버거 · 백드롭 · 라우팅 | `SPRING.sheet` translateX |
| 4 | Sidebar collapse (desktop) | 토글 버튼 | CSS transition (기존 유지) |
| 5 | StudyView card | 다음/이전 | `SPRING.page` + direction variants |
| 6 | Button press | `:active` (whileTap) | `SPRING.micro` scale 0.97 |
| 7 | Sheet | 열기/닫기 · 스와이프 다운 | `SPRING.sheet` translateY |
| 8 | Skeleton | 마운트 | CSS pulse (기존 유지) |
| 9 | Focus ring | `:focus-visible` | 즉시 (CSS outline) |
| — | reduced-motion 사용자 | 모든 것 | duration 0으로 대체 (MotionConfig) |
