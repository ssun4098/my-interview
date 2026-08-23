# Contract: Motion (Animations & Transitions)

이 앱의 모든 애니메이션 명세. 라이브러리 없이 순수 CSS + Next.js `template.js`로 구현.

---

## 1. 페이지 전환 (FR-313)

**Trigger**: 라우트 이동 (Next.js App Router `template.js` 마운트)

**Behavior**: 새 페이지가 아래에서 위로 6px 이동하며 opacity 0→1 페이드인

**Contract**:

```jsx
// app/template.js
'use client';

export default function Template({ children }) {
  return <div className="page-transition">{children}</div>;
}
```

```css
/* app/globals.css */
.page-transition {
  animation: pageIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
  animation-fill-mode: both;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Reduced motion**: 글로벌 `prefers-reduced-motion: reduce` 규칙이 `animation: none !important`로 대체 (§7 참조).

**SC**: SC-301 (200ms ± 30ms)

---

## 2. 사이드바 collapse/expand (FR-317)

**Trigger**: 사용자가 토글 버튼 클릭 → `collapsed` state 변경

**Behavior**: 사이드바 width가 240px ↔ 64px 사이 전환, 콘텐츠 영역 margin도 동시에 전환. 라벨 텍스트는 자연스럽게 사라짐/나타남 (overflow: hidden).

**Contract**:

```css
.sidebar {
  transition: width 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.app-main {
  transition: margin-left 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

`sidebar[data-collapsed="true"]`와 `app-layout[data-sidebar-collapsed="true"] .app-main` 조합으로 폭·마진 동시 변경.

**SC**: SC-302 (200ms 이내)

---

## 3. 모바일 drawer open/close (FR-318)

**Trigger**: 햄버거 버튼 · 백드롭 탭 · 라우팅

**Behavior**: 사이드바가 `translateX(-100%)` ↔ `translateX(0)` 사이 전환. 백드롭은 opacity 0 ↔ 1로 페이드.

**Contract**:

```css
.sidebar {
  transform: translateX(-100%);
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar[data-mobile-open="true"] {
  transform: translateX(0);
}

/* Backdrop */
.sidebar-backdrop {
  animation: fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Note**: 백드롭이 mount될 때 페이드인 자연스럽게 이루어짐. Unmount 시 페이드아웃은 즉시 제거로 처리 (200ms 페이드아웃까지 넣으려면 별도 exit 상태 관리 필요 — Constitution I에 비추어 도입 안 함).

---

## 4. 학습 카드 전환 (FR-316)

**Trigger**: 사용자가 학습/암기 모드에서 "다음"/"이전" 클릭 → `question.id`가 바뀌면서 React가 key 변경으로 노드 재마운트

**Behavior**: 새 카드가 opacity 0 → 1로 페이드인 (200ms).

**Contract**:

```jsx
// components/StudyView.js
<div key={question.id} className="study-card-fade">
  {/* card content */}
</div>
```

```css
.study-card-fade {
  animation: cardFade 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes cardFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Note**: 이전 카드의 명시적 페이드아웃은 없음(React가 unmount 즉시). 실사용 UX에서 200ms 페이드인만으로도 충분히 부드럽게 인지됨.

**SC**: SC-303 (250ms 이내 총 지각 시간)

---

## 5. 마이크로 인터랙션 — hover / active (FR-315)

**Trigger**: 마우스 hover · click / touch tap

**Behavior**:
- Hover: 배경/색 변화 (컴포넌트별로 다름), 120ms transition
- Active (press): scale(0.98), 120ms transition

**Contract** — 글로벌 CSS 규칙:

```css
button,
a[href] {
  transition:
    background-color 120ms cubic-bezier(0.16, 1, 0.3, 1),
    color 120ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 120ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

button:active:not(:disabled),
a[href]:active {
  transform: scale(0.98);
}
```

**Focus visible** (키보드 접근성):

```css
button:focus-visible,
a[href]:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**SC**: SC-304 (100% 인터랙션 요소가 피드백 제공)

---

## 6. 스켈레톤 pulse (FR-319)

**Trigger**: `<Skeleton>` 컴포넌트 마운트

**Behavior**: 배경 색이 subtle → subtle-plus → subtle로 1.5초에 걸쳐 무한 반복

**Contract**:

```jsx
// components/Skeleton.js
export default function Skeleton({ width, height, radius = 8 }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius }}
    />
  );
}
```

```css
.skeleton {
  background: var(--color-bg-subtle);
  animation: pulse 1500ms ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

## 7. 부드러운 스크롤 + reduced-motion (FR-314, FR-320)

**글로벌 규칙**:

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**SC**: SC-308 (100% 준수 — reduced motion 유저에게 모든 애니메이션이 즉시 전환)

---

## Motion Registry (전체 요약)

| # | 이름 | Duration | Easing | Impl |
|---|------|----------|--------|------|
| 1 | Page in | 200ms | ease-out | `template.js` + keyframes |
| 2 | Sidebar width | 200ms | ease-out | CSS transition |
| 3 | Drawer transform | 200ms | ease-out | CSS transition |
| 3b | Backdrop fade | 200ms | ease-out | CSS keyframes |
| 4 | Study card fade | 200ms | ease-out | key prop + keyframes |
| 5 | Button/link press | 120ms | ease-out | CSS transition + `:active` |
| 5b | Focus ring | (즉시) | — | `:focus-visible` outline |
| 6 | Skeleton pulse | 1500ms 무한 | ease-in-out | keyframes |
| — | reduced-motion 대체 | 0.01ms | — | `@media` |
