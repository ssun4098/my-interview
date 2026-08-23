# Implementation Plan: 모던 AI 서빙 UI 스타일 재디자인 + 앱 수준 인터랙션

**Branch**: `003-modern-app-ui` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-modern-app-ui/spec.md`

## Summary

앱의 시각·인터랙션을 Linear 스타일로 재정렬한다. 002에서 도입한 배민 정서적 요소(한나체 · 풀블리드 mint · 두꺼운 그림자 · 손그림 톤)는 제거하고, **Pretendard 단일 스택 · 얇은 보더 위계 · subtle 강조 · 정보 밀도 높은 목록**을 기본으로 삼는다. 사이드바 아키텍처는 유지된다(이미 확정된 사용자 선호).

앱 감각의 인터랙션은 **순수 CSS와 Next.js `template.js`**로 구현한다. `framer-motion` 같은 애니메이션 라이브러리는 도입하지 않음(Constitution I: ~20줄로 해결 가능). 페이지 전환 = fade + 6px 수직 슬라이드 200ms; 사이드바 collapse·drawer·마이크로 인터랙션도 CSS `transition`으로 표현. `prefers-reduced-motion` 미디어 쿼리로 접근성 자동 대응.

002의 인증·승인·데이터 계층(`middleware.js`·`lib/auth-actions.js`·`supabase/schema.sql`)은 이 스펙에서 손대지 않는다. 도메인 로직 변경 없이 **표면(surface) 재작성**만 하는 스펙이다.

## Technical Context

**Language/Version**: JavaScript (Node 20 LTS) — 변경 없음.

**Primary Dependencies**: **신규 없음**. 기존 `next` ^14.2, `react`/`react-dom` ^18.3, `@supabase/supabase-js`, `@supabase/ssr` 유지. **framer-motion 미도입** (Constitution I + SC-309 500KB gzip 예산 확보).

**Storage**: 변경 없음 (002 스키마 그대로).

**Testing**: 없음. 검증은 [quickstart.md](./quickstart.md)의 수동 시나리오.

**Target Platform**: Vercel serverless (변경 없음). 반응형 웹앱 — 네이티브 앱 아님.

**Project Type**: 단일 Next.js 웹 애플리케이션 (변경 없음).

**Performance Goals**:
- SC-301: 페이지 전환 200ms 정확 (±30ms)
- SC-302: 사이드바 접기 200ms 이내
- SC-303: 학습 카드 다음 문제까지 지각 시간 250ms 이내
- SC-307: 라우트 이동 CLS ≤ 0.05
- SC-309: 초기 필수 자산(gzip) ≤ 500KB — **한나체 CDN 제거로 여유가 오히려 늘어남**

**Constraints**:
- Constitution 5원칙 유지
- 다크 모드 미지원 (FR-324)
- `prefers-reduced-motion` 준수 (FR-320)
- 44px 최소 터치 영역 (FR-321)
- 002의 승인/RLS/인증 규칙 불변 (FR-325)

**Scale/Scope**: 002와 동일 (개인 학습 MVP).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 원칙 | 확인 | 위반 여부 |
|---|------|------|-----------|
| I | Simplicity First | 신규 의존성 0개, 신규 파일 ~7개(template.js · loading.js × 4 · Skeleton.js 등), 나머지는 기존 파일 재작성. framer-motion 미도입 | ✅ Pass |
| II | JavaScript Only | 모든 신규/수정 파일 `.js` / `.jsx`. TS 도입 없음 | ✅ Pass |
| III | Vercel-Ready | 커스텀 서버 없음, 폰트 CDN 링크 유지(Pretendard), `template.js`·`loading.js`는 App Router 표준 파일. `output: 'standalone'` 없음 | ✅ Pass |
| IV | Supabase Only | 데이터·인증 관련 변경 없음. UI 표면만 다룸 | ✅ Pass |
| V | README Documented | tasks에서 README 갱신 포함 예정 (한나체 제거·template.js 추가 반영) | ✅ Pass (유지 책임) |

**Complexity Tracking**: 없음.

## Project Structure

### Documentation (this feature)

```text
specs/003-modern-app-ui/
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── data-model.md        # Phase 1 (스키마 변경 없음, motion profile 정리)
├── quickstart.md        # Phase 1
├── contracts/
│   ├── README.md
│   ├── design-tokens.md   # Linear-tone 토큰 매핑 (002 대체)
│   ├── motion.md          # 페이지 전환·마이크로 인터랙션 계약
│   └── components.md      # Button/TextField/Chip/Card/Sidebar 신규 시각 사양
└── tasks.md             # /speckit-tasks가 생성
```

### Source Code (repository root)

이번 스펙의 코드 변경은 **표면 위주**. 인증·데이터·라우팅 파일은 손대지 않음.

```text
my-interview/
├── app/
│   ├── layout.js                       # 수정: BM 한나체 CDN 링크 제거
│   ├── template.js                     # ★ 신규: 페이지 전환 애니메이션 래퍼 (Client Component)
│   ├── globals.css                     # 대폭 재작성: Linear 톤 조정, 페이지 전환 keyframes, prefers-reduced-motion, smooth scroll, 글로벌 :active 피드백
│   ├── page.js                         # 변경 없음
│   ├── (auth)/
│   │   ├── login/page.js               # 수정: Linear 톤 재정렬
│   │   └── signup/page.js              # 수정: 동일
│   ├── sets/
│   │   ├── page.js                     # 수정: Linear 목록 톤 (얇은 보더·subtle 활성 상태)
│   │   ├── loading.js                  # ★ 신규: 스켈레톤
│   │   ├── new/page.js                 # 수정: 폼 재스타일
│   │   └── [id]/
│   │       ├── page.js                 # 수정: 상세 재스타일
│   │       ├── loading.js              # ★ 신규
│   │       ├── edit/page.js            # 수정
│   │       ├── study/page.js           # 수정 (title 톤만)
│   │       └── questions/
│   │           ├── new/page.js         # 수정
│   │           └── [qid]/edit/page.js  # 수정
│   ├── public-sets/
│   │   ├── page.js                     # 수정
│   │   ├── loading.js                  # ★ 신규
│   │   └── [id]/
│   │       ├── page.js                 # 수정
│   │       └── study/page.js           # 수정 (title 톤만)
│   └── profile/
│       └── page.js                     # 수정
├── components/
│   ├── AppShell.js                     # 미미한 조정
│   ├── Sidebar.js                      # 수정: Linear 톤 (active state · 아이콘 · 간격 refine)
│   ├── Button.js                       # 수정: Linear 스타일 재정렬
│   ├── TextField.js                    # 수정: 얇은 보더, focus 시 mint ring
│   ├── Chip.js                         # 수정: 낮은 채도, 더 작은 padding
│   ├── Card.js                         # 수정: 1px 보더, shadow=none 기본
│   ├── Skeleton.js                     # ★ 신규: pulsing rectangle utility
│   ├── KeywordInput.js                 # 미미한 조정
│   ├── QuestionSetForm.js              # 미미한 조정 (내부 primitives 재사용)
│   ├── QuestionForm.js                 # 미미한 조정
│   ├── StudyView.js                    # 수정: 카드 전환 CSS fade 추가 (key 재마운트 활용)
│   └── icons/index.js                  # stroke width 조정 검토 (2 → 1.75)
├── lib/                                # 변경 없음
├── middleware.js                       # 변경 없음
├── supabase/schema.sql                 # 변경 없음
├── public/favicon.svg                  # 변경 없음
└── README.md                           # 수정: 폰트 스택 변경·template.js 언급·loading.js 언급
```

**Structure Decision**:
- **`template.js`가 페이지 전환의 유일한 훅**. Next.js App Router는 route 변경 시 `template.js`를 다시 마운트하므로 CSS 애니메이션을 자연스럽게 실행할 수 있다. framer-motion 없이 ~20줄로 해결.
- **`loading.js`는 각 데이터 페칭 라우트에 배치**. Next.js가 Suspense 경계에서 자동 처리.
- **컴포넌트 신규 추가는 `Skeleton.js` 하나**. 나머지는 재스타일링만.
- **`components/AppShell.js`·`Sidebar.js`는 아키텍처 유지**. Linear 톤에 맞춰 시각만 refine.

## Complexity Tracking

*게이트 위반 없음, 이 표는 비워 둠.*

## Post-Design Constitution Re-check

Phase 1 아티팩트 작성 후:

| # | 원칙 | 결과 |
|---|------|------|
| I | Simplicity First | 신규 파일 7개, 신규 의존성 0개, framer-motion 미도입, 애니메이션 총 ~30줄 이내 CSS. ✅ |
| II | JS Only | 모든 신규/수정 파일 `.js`. ✅ |
| III | Vercel-Ready | template.js·loading.js는 Next.js App Router 표준 파일, 서버 상태 없음. 폰트 하나 줄어들어 초기 로드 개선. ✅ |
| IV | Supabase Only | 데이터·인증 계층 변경 없음. ✅ |
| V | README | tasks에 README 갱신 태스크 포함. ✅ |

**Result**: 통과.
