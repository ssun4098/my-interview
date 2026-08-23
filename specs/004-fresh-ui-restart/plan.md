# Implementation Plan: UI 처음부터 재구축 — 모던 감각 + 자연스러운 모바일 모션

**Branch**: `004-fresh-ui-restart` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-fresh-ui-restart/spec.md`

## Summary

003 스펙의 시각·모션 결정을 전면 폐기하고 **Toss + 텔레그램 + Naver Webtoon 세 앱의 공통 결**을 앵커로 재구축한다. 002의 인증·승인·데이터 계층은 손대지 않는 **표면(surface) + 모션 계층 재작성** 스펙이다.

**세 축이 확정됐다**:
- **테마**: 다크 온리 (딥 뉴트럴 캔버스 + Toss 계열 파란 액센트)
- **모바일 전환**: iOS-스타일 좌우 슬라이드 + 스프링 이징 + parallax
- **레이아웃**: 003의 좌측 접이식 사이드바 유지

이번 스펙은 처음으로 **애니메이션 라이브러리(motion, formerly framer-motion) 도입을 허용**한다. iOS-스타일 direction-aware spring 전환 + parallax + exit 애니메이션은 순수 CSS로 ~20줄 이내 구현 불가능하며, 이 spec의 핵심 요구(SC-403·SC-404·FR-408)를 위해서 정당화된다. Constitution I("~20줄 규칙")의 명시적 예외로 처리하고 근거를 Complexity Tracking에 기록한다.

## Technical Context

**Language/Version**: JavaScript (Node 20 LTS). 변경 없음.

**Primary Dependencies**:
- 기존: `next` ^14.2, `react`/`react-dom` ^18.3, `@supabase/supabase-js`, `@supabase/ssr`
- **신규**: `motion` (framer-motion 계승) — 최신 안정판(~11.x 계열). Tree-shaken import(`motion/react`) 기준 gzipped 약 34~40KB. SC-407(500KB gzip)에는 여유 있음

**Storage**: 변경 없음 (002 스키마 그대로).

**Testing**: 없음. 검증은 [quickstart.md](./quickstart.md)의 수동 시나리오.

**Target Platform**: Vercel serverless (변경 없음). 반응형 웹앱.

**Project Type**: 단일 Next.js 웹 애플리케이션.

**Performance Goals**:
- SC-403: 모바일 라우트 전환 방향성 있는 모션 (스크린 녹화 검증)
- SC-406: `prefers-reduced-motion` 준수 100%
- SC-407: 초기 필수 자산(gzip) ≤ 500KB — 한나체 CDN 없음, motion 라이브러리 추가에도 여유
- SC-408: 라우트 이동 CLS ≤ 0.05

**Constraints**:
- Constitution 원칙 유지 (Simplicity 예외 하나 문서화)
- 다크 모드 온리 (Clarify 확정)
- 002의 승인/RLS/인증 규칙 불변 (FR-418)
- 003의 좌측 사이드바 아키텍처 유지 (FR-419)

**Scale/Scope**: 002·003과 동일 (개인 학습 MVP).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 원칙 | 확인 | 위반 여부 |
|---|------|------|-----------|
| I | Simplicity First | 신규 컴포넌트 2개(PageTransition · Sheet), 신규 lib 1개(motion 헬퍼), 신규 페이지 0개. **`motion` 라이브러리 신규 1개 도입** — Complexity Tracking에 정당화 | ⚠ Justified (하단 표) |
| II | JavaScript Only | `motion` 라이브러리는 JS(ESM). TS 미도입. 모든 신규/수정 파일 `.js`/`.jsx` | ✅ Pass |
| III | Vercel-Ready | 커스텀 서버 없음, `motion`은 client-side 렌더링, 서버 상태 없음, `output: 'standalone'` 없음 | ✅ Pass |
| IV | Supabase Only | 데이터·인증 변경 없음. UI 표면만 다룸 | ✅ Pass |
| V | README Documented | tasks에서 README 갱신 포함 예정 (motion 도입·다크 테마·iOS 모션 반영) | ✅ Pass (유지 책임) |

## Project Structure

### Documentation (this feature)

```text
specs/004-fresh-ui-restart/
├── plan.md              # 이 파일
├── research.md          # Phase 0 (기술 결정 · 팔레트 합성)
├── data-model.md        # Phase 1 (스키마 변경 없음, motion profile 정리)
├── quickstart.md        # Phase 1 (수동 검증)
├── contracts/
│   ├── README.md
│   ├── design-tokens.md   # 다크 팔레트 · 라운드 · 타이포 스케일
│   ├── motion.md          # 스프링 config · 방향 감지 · 컴포넌트별 모션
│   └── components.md      # Button/TextField/Chip/Card/Sidebar/Sheet 시각 사양
└── tasks.md             # /speckit-tasks가 생성
```

### Source Code (repository root)

```text
my-interview/
├── app/
│   ├── layout.js                       # 수정: 다크 배경, MotionConfig 삽입
│   ├── template.js                     # 수정: motion AnimatePresence + PageTransition 래퍼
│   ├── globals.css                     # 대폭 재작성: 다크 팔레트, 청키 라운드, prefers-reduced-motion
│   ├── page.js                         # 변경 없음
│   ├── (auth)/
│   │   ├── login/page.js               # 수정: 다크 폼 재정렬
│   │   └── signup/page.js              # 수정: 동일
│   ├── sets/                           # 수정: 다크 카드/버튼
│   │   ├── page.js
│   │   ├── loading.js                  # 수정: 다크 스켈레톤
│   │   ├── new/page.js
│   │   └── [id]/
│   │       ├── page.js
│   │       ├── loading.js
│   │       ├── edit/page.js
│   │       ├── study/page.js
│   │       └── questions/
│   │           ├── new/page.js
│   │           └── [qid]/edit/page.js
│   ├── public-sets/
│   │   ├── page.js
│   │   ├── loading.js
│   │   └── [id]/
│   │       ├── page.js
│   │       ├── loading.js
│   │       └── study/page.js
│   └── profile/
│       └── page.js
├── components/
│   ├── AppShell.js                     # 수정: motion context (라우트 방향)
│   ├── PageTransition.js               # ★ 신규: template.js가 사용하는 motion.div 래퍼
│   ├── Sidebar.js                      # 수정: 다크 톤 · 스프링 드로어 (motion 사용)
│   ├── Button.js                       # 수정: 청키 라운드 · Toss 블루 · press animation
│   ├── TextField.js                    # 수정: 다크 인풋 · 파란 focus ring
│   ├── Chip.js                         # 수정: 다크 배경 · 액센트 variant
│   ├── Card.js                         # 수정: 다크 raised surface · 16px 라운드
│   ├── Sheet.js                        # ★ 신규: 모바일 하단 시트 (motion) — 확장 여지
│   ├── Skeleton.js                     # 수정: 다크 배경 shimmer
│   ├── ConfirmDeleteForm.js            # 미미한 조정 (Button variant)
│   ├── KeywordInput.js                 # 수정: 다크 인풋
│   ├── QuestionSetForm.js              # 미미한 조정
│   ├── QuestionForm.js                 # 미미한 조정
│   ├── StudyView.js                    # 수정: 다크 카드 · motion으로 문제 전환 (좌우 슬라이드)
│   └── icons/index.js                  # 미미한 조정 (stroke width 검토)
├── lib/
│   ├── motion.js                       # ★ 신규: 스프링 config · 방향 감지 hook
│   └── (기타 unchanged: supabase-*, auth-actions, set-actions, question-actions, queries, profile, username)
├── middleware.js                       # 변경 없음
├── supabase/schema.sql                 # 변경 없음
├── public/favicon.svg                  # 수정: Toss 블루 배경 + 흰 M
└── README.md                           # 수정: 다크 톤 · motion 도입 · Toss/Telegram/Webtoon 앵커
```

**Structure Decision**:
- **`motion` 라이브러리는 오직 UI 표면에서만 사용** (`components/`와 `app/template.js`). 인증·데이터·서버 로직에는 어떤 형태로도 침투 안 함. 이 격리가 Constitution IV(Supabase Only)를 지키는 방식.
- **`app/template.js`가 iOS-스타일 페이지 전환의 유일한 훅**. 라우트 방향은 `lib/motion.js`의 `useRouteDirection` hook이 pathname 깊이 비교로 감지.
- **`components/PageTransition.js`가 motion 로직을 격리** — template.js는 얇게 유지.
- **`components/Sheet.js` 신규 추가**는 향후 확장(삭제 확인 시트 등)을 위한 자리이며 이번 스펙에서 필수 사용은 아님.

## Complexity Tracking

**motion 라이브러리 도입 정당화 (Constitution I 예외 하나)**:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 신규 의존성 `motion` (~34KB gzipped) | FR-408이 iOS-스타일 direction-aware 슬라이드 + parallax + spring 이징 + exit 애니메이션을 요구. 순수 CSS는 exit 애니메이션과 spring physics를 안정적으로 구현할 수 없음. Route 방향 감지 + AnimatePresence + spring 조합은 DIY 시 최소 150~200줄의 신중한 코드 필요 | (a) 순수 CSS + `template.js`: exit 애니메이션 없어 iOS 감각 안 나옴 — 003에서 사용자가 명시 리젝트. (b) `@react-spring/web`(10KB): spring은 되지만 AnimatePresence 대응이 미비, 결국 유사 코드량. (c) 자체 구현: 시행착오·리팩터링 비용 큼. SC-407(500KB gzip)에 여유가 크므로 34KB 도입은 안전 |

이 예외는 이 스펙의 핵심 사용자 요구 하나("모바일에서 자연스러운 앱 감각")를 위해 도입한 것이며, 다른 곳(데이터·인증)에는 절대 확산되지 않는다.

## Post-Design Constitution Re-check

Phase 1 아티팩트 작성 후:

| # | 원칙 | 결과 |
|---|------|------|
| I | Simplicity First | `motion` 하나만 도입, 그 외 신규 의존성 0. 신규 파일 3개(PageTransition, Sheet, lib/motion). motion 사용 격리(UI만) 확인 | ⚠ Justified (동일 표) |
| II | JS Only | 모든 신규/수정 `.js`/`.jsx`. `motion` 라이브러리도 JS ESM | ✅ |
| III | Vercel-Ready | motion은 client-side. template.js가 렌더 시 자동 마운트. 서버 상태 없음 | ✅ |
| IV | Supabase Only | 데이터/인증 계층 무변경. motion은 UI 표면에만 | ✅ |
| V | README | tasks에 갱신 포함 | ✅ |

**Result**: 통과 (Simplicity 예외 문서화된 그대로 유지).
