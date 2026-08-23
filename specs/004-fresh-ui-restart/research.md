# Research: UI 처음부터 재구축 — 모던 감각 + 자연스러운 모바일 모션

**Feature**: 004-fresh-ui-restart · **Date**: 2026-08-23

Clarify에서 확정된 세 축(Toss/Webtoon/Telegram 앵커 · 다크 온리 · iOS 슬라이드+스프링)을 실제 구현으로 옮기기 위한 기술 결정 정리.

---

## R1. 모션 라이브러리 선택

**Decision**: **`motion`** (formerly `framer-motion`) 최신 안정판(11.x 계열)을 도입한다. React 통합은 `motion/react` 서브패키지 사용.

**Rationale**:
- FR-408 요구(iOS-스타일 direction-aware 슬라이드 + parallax + spring + exit 애니메이션)는 순수 CSS로 안정 구현 불가능. `AnimatePresence` + `motion.div` 조합이 정답.
- `motion` 라이브러리는 tree-shaken 시 gzipped **약 34~40KB** — SC-407(500KB 예산)에 여유 큼.
- 커뮤니티 표준 API로 초심자 학습 자료 풍부.
- Constitution I 예외는 plan.md의 Complexity Tracking에 명시.

**Alternatives considered**:
- **`@react-spring/web`** (약 10KB): spring physics만 필요하면 훌륭하지만 AnimatePresence·exit 애니메이션 API가 약해서 결국 자체 orchestration 코드가 늘어남.
- **순수 CSS + `template.js`**: 이전 003 방식. exit 애니메이션·spring physics 부재로 사용자가 명시적으로 "자연스럽지 않다"고 리젝트한 방식. 재사용 불가.
- **`react-transition-group` + CSS**: 저수준, boilerplate 많음. 코드량이 오히려 늘어남.
- **Auto animate**: 지나치게 자동화. 세밀 컨트롤 안 됨.

**Impact**:
- `package.json`에 `motion` 추가 → tasks의 T002.
- 사용은 `app/template.js`, `components/PageTransition.js`, `components/Sidebar.js`, `components/StudyView.js`, `components/Sheet.js`(신규)에 한정.
- 데이터·인증·서버 로직에는 절대 침투하지 않음.

---

## R2. 라우트 방향 감지 방식

**Decision**: **pathname 깊이 비교** — `pathname.split('/').filter(Boolean).length` (또는 유사)를 매 라우트 변경 시 이전 값과 비교하여 "forward"(더 깊음) / "back"(얕음) / "sibling"(같은 깊이)를 판정. React state로 이전 pathname·depth 저장.

**Rationale**:
- 신뢰할 수 있고 hydration-safe (SSR/CSR 모두 동일 결과 가능).
- `history.state.idx` 같은 브라우저 API는 App Router와 궁합이 완벽하지 않아 edge case 존재.
- 90% 케이스에서 정확: `/sets` → `/sets/[id]` (forward), `/sets/[id]` → `/sets` (back), `/sets` → `/public-sets` (sibling — 방향성 없음).

**Alternatives considered**:
- **`history.state.idx`**: Next.js가 관리하지만 예측 어려움.
- **명시적 스택 관리**: 컴포넌트별로 navigate 시 방향을 명시 → boilerplate 많음.
- **모든 전환을 forward로**: iOS 감각 소실 (뒤로 갈 때도 오른쪽에서 슬라이드인 되면 어색).

**Impact**:
- `lib/motion.js`에 `useRouteDirection()` hook 신설. `usePathname()`을 감시하며 direction 반환.
- `PageTransition` 컴포넌트가 이 direction을 받아 `initial`·`exit` variants를 다르게 적용.

---

## R3. 다크 팔레트 합성 (Toss + Telegram + Webtoon)

**Decision**: 세 레퍼런스의 공통점 + 각 앱의 시그니처를 균형 있게 조합한 다크 팔레트.

**색 결정**:

| Token | Value | 근거 |
|---|---|---|
| `--color-canvas` | `#0F1218` | Toss 다크 배경(약 #17181A)과 Webtoon(#1F1F26)의 중간. 파란 undertone. |
| `--color-bg-surface` | `#1A1F2E` | 카드/사이드바 표면. 캔버스 대비 살짝 밝음. |
| `--color-bg-elevated` | `#252B3D` | 모달·시트·팝업 등 더 raised surface. |
| `--color-bg-subtle` | `rgba(255,255,255,0.05)` | 호버·활성 subtle 배경. |
| `--color-primary` | `#3182F6` | **Toss 블루** — 세 앱 파란 액센트의 대표. |
| `--color-primary-hover` | `#4E97F7` | 살짝 밝은 blue. |
| `--color-primary-active` | `#1B6FDB` | 진한 blue press 상태. |
| `--color-primary-tint` | `rgba(49, 130, 246, 0.14)` | 활성 사이드바·subtle button 배경. |
| `--color-fg-1` | `#F0F1F5` | 주요 텍스트 — 순백 대신 살짝 회색 (Toss·Telegram 관습). |
| `--color-fg-2` | `#B0B5C0` | 본문·설명. |
| `--color-fg-3` | `#6E7383` | muted·caption. |
| `--color-fg-4` | `rgba(255,255,255,0.28)` | disabled. |
| `--color-border-1` | `rgba(255,255,255,0.06)` | subtle 보더. |
| `--color-border-2` | `rgba(255,255,255,0.12)` | input 보더. |
| `--color-danger` | `#F04452` | Toss 위험 액션에 가까움. |
| `--color-success` | `#00C853` | Webtoon·Toss 성공 톤. |

**Rationale**:
- 순백 텍스트 대신 `#F0F1F5` 사용 → Toss·Telegram이 다크에서 관습적으로 채택하는 소프트 화이트. 눈 피로도 감소.
- Primary가 Toss 블루로 통일 → 세 앱 파란 액센트 교집합의 가장 완성도 있는 톤.
- Danger·Success도 있으나 사용 최소화 (subtle 안내 위주).

**Alternatives considered**:
- **Telegram-스타일 짙은 blue-navy 캔버스(#17212B)**: 파란 톤 너무 강함. 콘텐츠 위에 파란 액센트가 잘 안 살아남.
- **완전 near-black(#000000)**: OLED 절약엔 유리하나 카드와 콘텐츠 구분이 어려워짐. 컨텐트 위계 만들기 힘듬.
- **Webtoon 계열(#1F1F26) 그대로 사용**: 무난하나 앞의 두 앱과 정합성 약함.

**Impact**:
- `app/globals.css` `:root`에 전체 팔레트 재정의.
- `contracts/design-tokens.md`에 매핑표 저장.

---

## R4. 라운드·간격 스케일 (chunky, 청키)

**Decision**: 세 레퍼런스의 청키한 컨테이너 미학을 반영해 라운드를 003 대비 상향.

| Token | 003 (Linear) | 004 (Toss/Telegram/Webtoon) |
|---|---|---|
| `--radius-sm` | 6px | 8px |
| `--radius-md` | 10px | 12px |
| `--radius-lg` | 12px | 16px |
| `--radius-xl` | 16px | 20px |
| `--radius-2xl` | 20px | 28px |
| `--radius-pill` | 9999px | 9999px |
| `--radius-sheet` | (신규) | 20px (모바일 하단 시트 상단 라운드) |

컴포넌트별 사용:
- Button: `--radius-md` (12px) — Toss 관습
- TextField: `--radius-md` (12px) — Toss 입력
- Card: `--radius-lg` (16px) — Toss 카드
- Chip: `--radius-pill` (chip은 pill 유지)
- Sheet: 상단만 `--radius-sheet` (20px)

간격 스케일(`--space-N`)은 003 그대로 유지 (4px 베이스가 세 앱 공통).

**Rationale**:
- Toss 카드는 16~20px 라운드로 청키한 감각.
- Telegram 말풍선도 12~16px.
- Webtoon 썸네일도 10~14px.
- 003의 얇은 Linear 라운드(6-10px)는 감각 안 남.

---

## R5. 타이포 스케일 (다크 톤 + 세 레퍼런스 공통)

**Decision**: Pretendard 유지 (세 앱 모두 Pretendard 또는 유사 노이슬라운드 grotesque 사용). 무게는 003보다 살짝 heavier — 다크 배경에서 텍스트가 더 두꺼워야 읽기 좋음.

| Element | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| h1 | 22px | 700 | 1.25 | -0.02em |
| h2 | 18px | 700 | 1.3 | -0.015em |
| h3 | 15px | 600 | 1.4 | -0.01em |
| Body | 14~15px | 400~500 | 1.5 | 0 |
| Caption | 13px | 500 | 1.4 | 0.1px |
| Button | 14~15px | 600 | 1.4 | 0 |

**Rationale**:
- 다크 배경에서 얇은(300~400) 폰트는 얇아 보이는 이슈. weight 하나씩 올려 안정.
- 헤드라인 -0.02em letter-spacing → Toss가 사용하는 tight 헤드라인 톤.

---

## R6. 스프링 이징 프리셋

**Decision**: `motion` 라이브러리의 `spring` transition 사용. 3가지 프리셋을 `lib/motion.js`에 정의:

```js
export const SPRING = {
  // 페이지 전환용 — iOS 관습에 가까운 damping
  page: { type: 'spring', stiffness: 350, damping: 32, mass: 0.8 },
  // 드로어·시트 — 살짝 더 통통
  sheet: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
  // 마이크로 (버튼 press 반응) — 짧고 빠름
  micro: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
};
```

**Rationale**:
- iOS 페이지 전환은 대략 300~400 stiffness · 30~35 damping 조합.
- 필요 시 CSS `cubic-bezier(0.32, 0.72, 0, 1)` 폴백 (iOS webkit 스타일).
- `prefers-reduced-motion` 사용자에게는 spring 대신 `{ duration: 0 }`으로 즉시 전환.

---

## R7. AnimatePresence orchestration

**Decision**: `app/template.js`에 `AnimatePresence mode="popLayout"` 사용. `PageTransition` 컴포넌트가 direction에 따라 variants를 다르게 적용:

```jsx
// 대략 이런 형태
const variants = {
  enterFrom: (direction) => ({
    x: direction === 'back' ? '-30%' : '100%',
    opacity: direction === 'back' ? 1 : 0.5,
  }),
  center: { x: 0, opacity: 1 },
  exitTo: (direction) => ({
    x: direction === 'back' ? '100%' : '-30%',
    opacity: direction === 'back' ? 0.5 : 1,
  }),
};
```

- **Forward (더 깊은 경로)**: 새 화면이 오른쪽에서 슬라이드인(100% → 0), 이전 화면은 왼쪽으로 -30% parallax 이동하며 살짝 어두워짐(opacity 0.5).
- **Back (얕은 경로)**: 반대. 새 화면(원래 왼쪽에 있던 것)이 -30% → 0으로, 이전 화면은 오른쪽으로 100% 슬라이드아웃.
- **Sibling (같은 깊이)**: 방향성 없이 crossfade.
- **Desktop**: 방향 감지는 하지만 슬라이드 대신 절제된 fade(6~8px 슬라이드) 적용.

**Rationale**:
- iOS의 실제 관습 그대로.
- parallax(30% 이동)이 "레이어드 카드" 감각을 강화 — Toss·Telegram·iOS 앱의 공통 특징.
- Sibling 전환 방향성 없는 게 자연스러움 (형제 라우트 이동은 "옆으로" 개념이 없음).

---

## R8. iOS Safari 스와이프 뒤로 가기 충돌 방지

**Decision**: 스와이프 뒤로 가기 발생 시 `popstate` 이벤트를 감지하고, 브라우저의 native slide 애니메이션과 우리 `AnimatePresence` 애니메이션이 겹치지 않도록 처리. 구체적으로 `popstate`가 감지되면 우리 애니메이션의 duration을 짧게(120ms)로 축소하거나 skip.

**Rationale**:
- FR-417 요구.
- iOS Safari는 스와이프 시 자체 슬라이드 애니메이션을 실행. 우리가 또 슬라이드를 걸면 이중 이동감.
- Next.js App Router에서 `popstate` 감지 후 상태 관리.

**Impact**:
- `lib/motion.js`의 `useRouteDirection`에 popstate 감지 로직 포함.

---

## R9. 모바일 드로어 (사이드바) 스프링화

**Decision**: 사이드바 드로어 열기/닫기를 CSS transition에서 `motion`의 spring으로 교체.

```jsx
<motion.aside
  animate={{ x: mobileOpen ? 0 : '-100%' }}
  transition={SPRING.sheet}
/>
```

Backdrop도 `AnimatePresence`로 fade in/out.

**Rationale**:
- 003의 CSS transition으로는 spring 감각 안 나옴 (사용자가 "부드럽지 않다" 지적).
- Sidebar 컴포넌트 내부만 손대면 되므로 격리 잘 됨.

---

## R10. 학습 카드 전환 (StudyView)

**Decision**: `motion` + `AnimatePresence` + `key={question.id}`로 다음/이전 카드 전환을 방향성 있게. 다음 = 왼쪽으로 나감·오른쪽에서 들어옴. 이전 = 반대.

**Rationale**:
- FR-411 요구 (fade-only 금지, 방향성 요구).
- 학습 몰입 감각 향상.

**Impact**:
- `StudyView.js`가 direction state 자체 관리 (`goNext`/`goPrev`에서 direction 설정).

---

## R11. 접근성 · reduced-motion 처리

**Decision**: `motion` 라이브러리의 `useReducedMotion()` hook을 최상위 컴포넌트에서 감지 후 각 motion prop에 조건부 적용. 또는 CSS `@media (prefers-reduced-motion: reduce)`로 spring transition 지속시간을 0으로 오버라이드.

**Rationale**:
- FR-413 준수.
- `motion` 라이브러리는 이 use case를 위한 표준 API 제공.

---

## R12. 미도입 결정 (No Adds)

이 스펙에서 도입하지 **않는** 것들:

- **Tailwind CSS**: 인라인 스타일 + CSS 변수 유지.
- **Radix UI**: `Sheet`·기타 이 스펙 신규 컴포넌트도 자체 구현.
- **`@react-spring/web`**: `motion`으로 통일 (라이브러리 2개 병존 회피).
- **다크/라이트 자동 스위칭**: 다크 온리 (FR-418).
- **PWA·서비스 워커**: 이 스펙 범위 밖.
- **햅틱 피드백 (Vibration API)**: 이 스펙 범위 밖. 필요 시 후속.

**Rationale**: YAGNI. 사용자 요구(모던·감각·자연스러운 모션) 정확 달성이 우선.
