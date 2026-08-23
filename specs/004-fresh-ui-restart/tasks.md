---

description: "Task list for 004-fresh-ui-restart (Toss/Telegram/Webtoon dark UI + iOS-style spring motion)"
---

# Tasks: UI 처음부터 재구축 — 모던 감각 + 자연스러운 모바일 모션

**Input**: Design documents from `/specs/004-fresh-ui-restart/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md). Requires 002 baseline (auth·approval·RLS) + 003 baseline (사이드바 아키텍처 · 파일 트리) running.

**Tests**: **Not included.** Spec did not request tests; validation is manual per [quickstart.md](./quickstart.md).

**Organization**: 2 P1 stories. **US1 = visual system (Toss/Webtoon/Telegram 다크 톤 + 청키 컨테이너)**, **US2 = mobile-first motion (iOS spring slide with direction · parallax · popstate 정합)**. 두 스토리는 병렬 진행 가능하지만 solo dev는 US1 → US2 순서 권장 (motion이 성립한 UI 위에 얹혀야 시각적으로 안착됨).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일, 미완료 태스크 의존 없음
- **[Story]**: `[US1]` 또는 `[US2]` — user-story-phase 태스크만
- 파일 경로는 repo root 기준 상대 경로

## Path Conventions

- 단일 Next.js 앱, repo root.
- 신규 파일: `components/PageTransition.js`, `components/Sheet.js`, `lib/motion.js`.
- 002 auth·data 계층(`middleware.js`, `lib/auth-actions.js`, `lib/*-actions.js`, `lib/queries.js`, `lib/profile.js`, `supabase/schema.sql`)은 **손대지 않음**.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: `motion` 라이브러리 도입 + 003 baseline 확인.

- [X] T001 Install motion library: `npm install motion` (latest stable ~11.x). Verify entry in `package.json` under `dependencies`. Import path will be `motion/react` throughout.
- [X] T002 Verify baseline: 003 파일 구조가 존재하는지 확인 (`app/template.js`, `app/layout.js`, `components/AppShell.js`, `components/Sidebar.js`, `components/Button.js`, `components/TextField.js`, `components/Chip.js`, `components/Card.js`, `components/Skeleton.js`, `components/StudyView.js`, `components/icons/index.js`, `app/*/loading.js` 4개, `app/profile/page.js`). 없으면 003 tasks를 먼저 완료해야 함.

**Checkpoint**: `motion` 설치 완료, baseline 확인.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design token 다크 전환 + motion 프리셋 · 방향 감지 hook · MotionConfig 셋업. 두 스토리 모두 이 세 파일에 의존.

- [X] T003 Rewrite `app/globals.css` per [contracts/design-tokens.md](./contracts/design-tokens.md):
      (a) `:root {}`의 모든 color·radius·shadow 토큰을 표에 따라 다크 팔레트로 교체 (`--color-canvas: #0F1218`, `--color-primary: #3182F6`, `--color-fg-1: #F0F1F5` 등);
      (b) `--radius-sm/md/lg/xl/2xl`를 청키 값으로 상향 (6/8/10/12/16 → 8/12/16/20/28);
      (c) `--radius-sheet: 20px` 신규 추가;
      (d) `--glow-primary: 0 0 0 3px rgba(49,130,246,0.28)` 신규;
      (e) `body` background는 이제 다크 canvas + subtle radial gradient는 제거 (Airtable/Discord 시도 흔적 청산; 순수 다크 canvas가 Toss·Telegram 톤에 맞음);
      (f) `h1/h2/h3` 크기·weight·letter-spacing 재정의 (h1: 22px 700 -0.02em, h2: 18px 700 -0.015em, h3: 15px 600 -0.01em);
      (g) `body` 기본 색을 `--color-fg-2` (`#B0B5C0`), 기본 배경을 `--color-bg-page`로;
      (h) `.muted` 색을 `--color-fg-3` (`#6E7383`)로;
      (i) 사이드바·mobile-topbar·app-layout responsive 규칙은 003에서 유지되던 것 그대로 (background 값들만 다크 토큰 반영);
      (j) `.study-card-fade`·`.page-transition` 등 003의 CSS keyframe 애니메이션 정의는 제거 (motion 라이브러리가 대체);
      (k) `@media (prefers-reduced-motion: reduce)` 규칙은 유지 (CSS만으로 커버할 skeleton·smooth-scroll 대응).
- [X] T004 Create `lib/motion.js` per [contracts/motion.md](./contracts/motion.md) §1·§2:
      (a) `SPRING` 상수 export (page 350/32/0.8, sheet 300/30/0.9, micro 500/30/0.5);
      (b) `INSTANT` 상수 (`{ duration: 0 }`);
      (c) `useRouteDirection()` hook — `usePathname()` 감시 + pathname 깊이 비교 + `popstate` 이벤트 감지 결합. `'forward' | 'back' | 'sibling'` 반환.
- [X] T005 Update `app/layout.js`: import `MotionConfig` from `motion/react` and wrap `<AppShell>` with `<MotionConfig reducedMotion="user">`. Preserve `dynamic = 'force-dynamic'` and profile fetch logic unchanged.
- [X] T006 [P] Update `public/favicon.svg`: 배경 rect fill을 `#3182F6` (Toss 블루), path fill 흰색 유지. rx 값 8 유지.

**Checkpoint**: 새 다크 톤이 body에 자동 반영 (기존 컴포넌트들이 아직 003 값을 참조해도 대부분 자동으로 새 값 인식). MotionConfig 활성. `lib/motion.js` 준비 완료.

---

## Phase 3: User Story 1 - 모던 감각 시각 시스템 (Priority: P1)

**Goal**: 모든 화면이 Toss/Telegram/Webtoon 앵커의 다크 톤 + 청키 컨테이너로 재렌더. 사용자가 "모던하다"고 발화하고 "튄다·촌스럽다" 지목이 0.

**Independent Test**: 데스크톱(1440×900)과 모바일(375×667)에서 4개 대표 화면(내 문제집 목록 · 문제집 상세 · 학습 모드 · 프로필) 순회하며:
(a) 딥 뉴트럴 다크 캔버스(`#0F1218`),
(b) 카드 raised surface(`#1A1F2E`) + 16px 라운드,
(c) primary 액션은 Toss 블루(`#3182F6`) 12px 라운드,
(d) 사이드바 활성 항목 파란 tint + 좌측 2px accent bar,
(e) 헤드라인 tight letter-spacing (-0.02em) 확인,
(f) footer 없음 (`document.querySelector('footer') === null`).

### Component Primitive Refactor

- [X] T007 [P] [US1] Update `components/Button.js` per [contracts/components.md](./contracts/components.md) §Button:
      (a) `variant` 매핑 재정의 — primary/ghost/danger/link + green(legacy=primary alias);
      (b) primary bg `--color-primary` + fg `--color-fg-1`, ghost bg `--color-bg-subtle` + border `--color-border-2`, danger 텍스트 `--color-danger`;
      (c) `border-radius: var(--radius-md)` (12px);
      (d) size heights sm=36 / md=44 / lg=52 (모바일 44px 터치 확보);
      (e) `motion.button`로 변경 + `whileTap={{ scale: 0.97 }}` + `transition={SPRING.micro}` 적용 (import `motion` from `motion/react`, `SPRING` from `@/lib/motion`);
      (f) `motion` 사용을 위해 파일 상단 `'use client'` 유지.
- [X] T008 [P] [US1] Update `components/TextField.js`: bg `--color-bg-surface`, border 1px `--color-border-2`, focus border 1.5px `--color-primary` + outer glow `--glow-primary`. Height 48px, radius `--radius-md` (12px), padding '0 14px'. Placeholder `--color-fg-3`. `motion` 불필요 (CSS focus로 충분).
- [X] T009 [P] [US1] Update `components/Chip.js`: variant 재정의 — default(bg-subtle/fg-2), primary(primary-tint/primary-hover), danger(danger-tint/danger), success(신규). radius pill 유지. padding '3px 10px', font 12px 600.
- [X] T010 [P] [US1] Update `components/Card.js`: default `radius='var(--radius-lg)'` (16px), `shadow='none'`, `border=true` (1px `--color-border-1`), `background: var(--color-bg-surface)` (컴포넌트 내부 하드코딩 대신 인라인 style로).
- [X] T011 [P] [US1] Update `components/Skeleton.js`: `.skeleton` CSS 규칙 자체는 globals.css의 pulse animation을 그대로 사용. base bg만 `rgba(255,255,255,0.08)`로 상향해 다크에서 pulse가 인지되도록 (globals.css의 `.skeleton` 규칙 수정 또는 컴포넌트 내부 inline background 값 수정).
- [X] T012 [P] [US1] Update `components/icons/index.js`: `base.strokeWidth`을 1.75 → 2로 복원 (다크에서는 얇은 stroke가 optical 얇아 보임).

### Sidebar Visual Refinement

- [X] T013 [US1] Update `components/Sidebar.js` visual only per [contracts/components.md](./contracts/components.md) §Sidebar: sidebar bg `--color-bg-surface`, 오른쪽 보더 1px `--color-border-1`, 활성 항목 배경 `--color-primary-tint`, 활성 좌측 accent bar 2px `--color-primary`, 활성 텍스트 `--color-fg-1` weight 600, 비활성 텍스트 `--color-fg-3` weight 500. Header 로고 700 weight. Footer 로그아웃 버튼은 이미 `<Button variant="ghost" size="sm" fullWidth>` 사용 중 → variant는 유지, 자동으로 새 톤 적용. **Motion 개선(mobile drawer spring)은 US2 T023에서 처리 — 이 태스크는 시각만.**

### Form Components

- [X] T014 [P] [US1] Update `components/KeywordInput.js`: 내부 `<input>` style을 새 TextField spec에 맞춤 (bg `--color-bg-surface`, height 40, padding '0 14px', border 1px `--color-border-2`, radius `--radius-md`). Chip 렌더는 이미 `<Chip variant="default">` 사용 중.
- [X] T015 [P] [US1] Update `components/QuestionSetForm.js`: form gap `--space-4` 유지. SubmitButton은 이미 `<Button variant="primary">` 사용 중. 오류 블록 스타일은 `--color-danger-tint`/`--color-danger`로 (자동 반영).
- [X] T016 [P] [US1] Update `components/QuestionForm.js`: T015와 동일 조정.

### Study View Visual (motion은 US2에서)

- [X] T017 [P] [US1] Update `components/StudyView.js` visual only:
      (a) 카드 wrap은 `<Card>` 그대로 사용 (자동으로 다크 raised surface);
      (b) `.study-card-fade` 클래스 제거 (globals.css에서 이미 삭제, 컴포넌트 코드에서도 제거);
      (c) title h2 스케일, content color `--color-fg-2` line-height 1.65, keywords는 `<Chip variant="primary">`로 변경 (파란 tint로 강조 · Toss/Webtoon 관습);
      (d) 완료 화면 카드 안 텍스트 색 `--color-fg-2`, "문제집으로 돌아가기" 버튼 variant="primary" 유지.
      **Motion(direction-aware card transition)은 US2 T024에서 처리.**

### Auth Pages

- [X] T018 [P] [US1] Update `app/(auth)/signup/page.js`: 컨테이너 `<Card>` 그대로 (자동 다크). h1 fontSize 22 유지. SubmitButton `<Button variant="primary" fullWidth>` 유지. `signedUp` 배너 background는 이미 `--color-primary-tint` 사용 중 (자동으로 파란 tint로 바뀜) — 그대로.
- [X] T019 [P] [US1] Update `app/(auth)/login/page.js`: T018과 동일 조정. `revoked` 배너 background `--color-bg-subtle` (자동으로 다크 subtle).

### List / Detail Pages

- [X] T020 [P] [US1] Update `app/sets/page.js`: 각 set-row `<Card>`가 자동 다크. 리스트 사이 간격 `--space-2` 유지. Chip `variant={s.is_public ? 'primary' : 'default'}` (공개 = Toss 블루 tint로 눈에 띔).
- [X] T021 [P] [US1] Update `app/sets/new/page.js`: `<Card>` 자동 반영, 추가 조정 없음.
- [X] T022 [P] [US1] Update `app/sets/[id]/page.js`: title area h1 · badge · action buttons · question rows 모두 primitive 변경으로 자동 반영. **"학습 모드로 열기" 버튼 variant를 "green"에서 "primary"로 되돌림** (green은 legacy Discord 시도 흔적, primary가 이제 Toss 블루라 highest-intent 표현). "암기 모드로 열기"는 ghost 유지.
- [X] T023 [P] [US1] Update `app/sets/[id]/edit/page.js`: `<Card>` 자동, 추가 조정 없음.
- [X] T024 [P] [US1] Update `app/sets/[id]/questions/new/page.js`: 자동.
- [X] T025 [P] [US1] Update `app/sets/[id]/questions/[qid]/edit/page.js`: 자동.
- [X] T026 [P] [US1] Update `app/sets/[id]/study/page.js`: h1 스타일 확인, `<Card>` 자동.
- [X] T027 [P] [US1] Update `app/public-sets/page.js`: T020과 동일 treatment.
- [X] T028 [P] [US1] Update `app/public-sets/[id]/page.js`: "학습 모드로 열기" 버튼 variant를 "green"에서 "primary"로 되돌림 (T022와 동일 이유).
- [X] T029 [P] [US1] Update `app/public-sets/[id]/study/page.js`: h1 · `<Card>` 자동.
- [X] T030 [P] [US1] Update `app/profile/page.js`: `<Card>` · Button 자동.

### Loading (Skeleton) Pages

- [X] T031 [P] [US1] Verify `app/sets/loading.js`, `app/sets/[id]/loading.js`, `app/public-sets/loading.js`, `app/public-sets/[id]/loading.js` — `<Skeleton>` bg가 다크에서 잘 인지되는지 확인. T011의 `.skeleton` 규칙 조정으로 자동 반영되어야 함.

**Checkpoint**: 모든 화면이 다크 톤 + 청키 컨테이너로 렌더. `<footer>` 없음. Toss 블루가 CTA/사이드바 활성/focus 3자리에만 등장. 시각 인상이 003의 밝은 Linear 톤에서 완전히 벗어남.

---

## Phase 4: User Story 2 - iOS 스타일 자연스러운 모션 (Priority: P1)

**Goal**: 페이지 전환·사이드바·학습 카드가 모두 direction-aware spring 모션으로 재작성. 모바일에서 앱 감각 확립, iOS Safari 스와이프 뒤로 가기와 정합.

**Independent Test**: 모바일 375×667에서 (a) 목록→상세 이동 시 오른쪽에서 슬라이드인 + 이전 화면 -30% parallax, (b) 뒤로 시 반대, (c) 사이드바 햄버거→스프링 드로어, (d) 학습 카드 다음→왼쪽으로 나감·오른쪽에서 새 카드, (e) 데스크톱은 방향성 없이 절제된 fade, (f) `prefers-reduced-motion` 사용자에게는 모두 즉시 전환.

### Page Transition

- [X] T032 [US2] Create `components/PageTransition.js` per [contracts/motion.md](./contracts/motion.md) §3:
      (a) `'use client'` client component;
      (b) import `motion, AnimatePresence, useReducedMotion` from `motion/react`;
      (c) `usePathname()` + `useRouteDirection()` (from `@/lib/motion`);
      (d) 뷰포트 감지: 간단히 `matchMedia` window API 사용 (`useEffect`로 `useState`에 boolean isMobile 저장);
      (e) `AnimatePresence mode="popLayout"` + `motion.div key={pathname}` 구조;
      (f) `variants` = direction과 isMobile 조합에 따라 다르게 계산 (mobile forward: x 100%→0, mobile back: x -30%→0, sibling: crossfade, desktop: fade+8px slide);
      (g) `useReducedMotion()`이 true면 opacity만 애니메이트 (변수는 즉시);
      (h) `transition={SPRING.page}` (모바일) 또는 `{ duration: 0.2 }` (데스크톱).
- [X] T033 [US2] Update `app/template.js`: default export가 `<PageTransition>{children}</PageTransition>` 반환하도록 교체. `'use client'` 지시어 불필요 (PageTransition이 client이므로).

### Sidebar Drawer Spring

- [X] T034 [US2] Update `components/Sidebar.js` motion:
      (a) drawer aside를 `motion.aside`로 변경, `animate={{ x: mobileOpen ? 0 : '-100%' }}`, `transition={SPRING.sheet}`;
      (b) 기존 CSS transition transform 규칙은 globals.css에서 유지되나 motion animate가 우선순위 이김 (CSS transform은 desktop collapse의 width 애니메이션 용도로만 남음);
      (c) backdrop을 `<AnimatePresence>` 안에서 `motion.div initial/animate/exit opacity 0→1`으로 변경;
      (d) desktop collapse (width 240 ↔ 64)는 CSS transition 유지 (motion으로 width 애니메이션은 layout thrash 우려).
- [ ] T035 [US2] Verify: mobile drawer 열림/닫힘이 딱딱한 slide가 아닌 spring 감쇠로 착지하는지 시각 확인. `prefers-reduced-motion` 활성 시 즉시 전환되는지 (MotionConfig가 처리).

### Study View Card Motion

- [X] T036 [US2] Update `components/StudyView.js` motion:
      (a) `import { motion, AnimatePresence } from 'motion/react'` + `SPRING`;
      (b) `direction` state 추가 (1 forward, -1 back), `goNext`/`goPrev`에서 설정;
      (c) 카드 wrap을 `<AnimatePresence mode="popLayout" custom={direction}>` + `<motion.div key={question.id} custom={direction} variants={...} initial="enter" animate="center" exit="exit" transition={SPRING.page}>`로 감쌈;
      (d) variants에서 `x` 이동은 ±40px, opacity는 0.3~1;
      (e) 완료 화면(`index >= total`)에도 subtle enter (opacity 0→1, y 8px→0) 적용해 등장감 강화.

### Sheet Component (신규, 확장 자리)

- [X] T037 [P] [US2] Create `components/Sheet.js` per [contracts/motion.md](./contracts/motion.md) §7:
      (a) `'use client'` + `motion, AnimatePresence` import;
      (b) props: `open`, `onClose`, `children`;
      (c) `AnimatePresence` 안에 backdrop `motion.div` (fade) + sheet `motion.div` (`initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={SPRING.sheet}`);
      (d) sheet에 `drag="y" dragConstraints={{ top: 0 }} onDragEnd={(e, info) => info.offset.y > 100 && onClose()}` 추가로 스와이프 다운 닫기;
      (e) sheet CSS: `background: var(--color-bg-elevated)`, `border-radius: var(--radius-sheet) var(--radius-sheet) 0 0`, `padding: var(--space-5)`, `position: fixed; bottom: 0; left: 0; right: 0; max-height: 80vh; z-index: 60;`;
      (f) 상단 grab handle (4x36 rounded `--color-border-2`) 추가.
      **이번 스펙에서 필수 사용처 없음 — 이후 삭제 확인 등 확장 자리.**

### iOS Safari popstate 충돌 방지

- [ ] T038 [US2] Verify `useRouteDirection` in `lib/motion.js`가 `popstate` 이벤트를 정확히 감지하고 direction을 'back'으로 강제하는지 검증. 필요 시 iOS Safari 실기(또는 Chrome DevTools iPhone emulation)에서 스와이프 뒤로 가기 시 이중 이동감 없는지 확인. 발견되면 popstate 감지 케이스에서 PageTransition의 transition을 `{ duration: 0.15 }`로 축소하는 조건부 로직 추가.

**Checkpoint**: 모바일에서 앱 감각 확립. 각 라우팅 전환에 방향성 있는 spring slide. 사이드바 spring drawer. 학습 카드 direction-aware. 데스크톱은 절제된 fade. Reduced motion 100% 준수.

---

## Phase 5: Polish & Cross-Cutting

- [X] T039 [P] Run `npm run lint`; fix any warnings.
- [X] T040 [P] Run `npm run build`; verify success. "First Load JS shared by all"에 `motion` 청크가 반영되어 120~130KB 총 예상 (여전히 SC-407 500KB 여유).
- [X] T041 [P] Constitution sweep: `git grep -nE "\.tsx?$"` 없음; `tsconfig.json` 없음; `typescript`/`@types/*` package.json 없음; `server.js` 없음; `output: 'standalone'` 없음. `framer-motion` 대신 `motion` 하나만 있는지 (framer-motion 라이브러리는 없어야 함, package.json에 `motion`만).
- [X] T042 [P] Update `README.md`:
      (a) 폴더 트리에 `components/PageTransition.js`, `components/Sheet.js`, `lib/motion.js` 추가;
      (b) "기술 스택"에 `motion` (formerly framer-motion) 명시;
      (c) "디자인 · 인터랙션 톤" 섹션 재작성: Toss/Telegram/Webtoon 앵커, 다크 온리, iOS spring slide, Toss 블루 primary;
      (d) 003의 Linear 톤 언급 제거.
- [ ] T043 Manual walkthrough per [quickstart.md](./quickstart.md) §3.1 (US1 시각) + §3.2 (US2 모션). 데스크톱(1440×900) + 모바일(375×667) + reduced-motion 세 조건 모두 확인.
- [ ] T044 Deploy to Vercel; 배포 URL에서 quickstart §3 재검증. 특히 실제 iOS Safari에서 스와이프 뒤로 가기 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001·T002 병렬 가능.
- **Phase 2 (Foundational)**: **BLOCKS both US1 and US2.** T003(globals.css) · T004(lib/motion.js) · T005(layout MotionConfig) · T006(favicon) 모두 병렬 가능.
- **Phase 3 (US1)**: depends on Phase 2. Internal 순서: primitives(T007~T012) 병렬 → Sidebar 시각(T013) → forms(T014~T016) 병렬 → StudyView 시각(T017) → pages(T018~T031) 대량 병렬.
- **Phase 4 (US2)**: depends on Phase 2. US1과 병렬 가능하지만 시각적으로는 US1 이후에 얹혀야 자연스러움 확인 가능.
- **Phase 5 (Polish)**: after both stories.

### Parallel Opportunities

Phase 2 (모두 병렬):
```text
T003 · T004 · T005 · T006
```

Phase 3 첫 웨이브 (primitives · icons):
```text
T007 · T008 · T009 · T010 · T011 · T012 (6개 병렬)
```

Phase 3 두 번째 웨이브 (Sidebar → forms):
```text
T013 (sequential; Button 새 사양 필요)
T014 · T015 · T016 (병렬; primitives 준비 후)
```

Phase 3 세 번째 웨이브 (pages):
```text
T017 · T018 · T019 · T020 · T021 · T022 · T023 · T024 · T025 · T026 · T027 · T028 · T029 · T030 · T031 (15개 병렬; 서로 다른 파일)
```

Phase 4:
```text
T032 (PageTransition) → T033 (template.js 교체, PageTransition 필요)
T034 (Sidebar drawer motion) · T036 (StudyView motion) · T037 (Sheet) — 3개 병렬
T035 · T038 은 수동 검증
```

Phase 5:
```text
T039 · T040 · T041 · T042 (4개 병렬)
T043 · T044 수동 (sequential 마지막)
```

---

## Implementation Strategy

### 권장 순서 (solo dev, US1 → US2)

1. Phase 1: T001 (npm install motion), T002 (baseline check).
2. Phase 2: T003·T004·T005·T006 동시.
3. Phase 3: primitives(T007~T012) → Sidebar(T013) → forms(T014~T016) → pages(T017~T031).
4. **STOP · VALIDATE**: 데스크톱·모바일에서 quickstart §3.1 통과 여부 확인. 다크 톤이 자연스럽고 사용자가 "촌스럽다"고 지목하는 요소가 없는지 자기 검토.
5. Phase 4: PageTransition(T032·T033) → Sidebar drawer motion(T034) · StudyView motion(T036) · Sheet(T037).
6. **STOP · VALIDATE**: 모바일 뷰포트에서 방향성 있는 spring slide 감각 확인. iOS 실기 확인.
7. Phase 5: 폴리시 + 배포.

### 병렬 팀 전략

- Dev A: US1 (~25 tasks) — 시각 재정렬. 대부분 파일별 병렬.
- Dev B: US2 (~7 tasks) — motion 통합. Phase 2 완료 후 시작.

---

## Notes

- `[P]` = 다른 파일, 미완료 의존 없음.
- `[USn]` 라벨은 spec.md의 user story로 추적.
- 검증은 manual (Constitution IV, spec 옵션).
- **`motion` 외 신규 의존성 도입 금지** (framer-motion 별도 도입 X, Tailwind X, Radix X, react-spring X 등).
- 002 auth/data 계층(`middleware.js`·`lib/auth-actions.js`·기타 `lib/*-actions.js`·`lib/queries.js`·`lib/profile.js`·`supabase/schema.sql`)은 **절대 손대지 않음**.
- 다크 팔레트가 body 배경으로 자동 반영되므로 페이지 태스크(T017~T031) 대부분이 "변경 최소" 성격. Card·Button·Chip·TextField·Skeleton primitive만 새 사양이면 나머지는 저절로.
- iOS Safari 스와이프 뒤로 가기 정합은 실기 확인 필수 (T038). Chrome DevTools의 iPhone emulation으로는 시뮬레이션 불완전.
