# Contract: Design System (DESIGN.md → app)

이 문서는 [DESIGN.md](../../../DESIGN.md)에 정의된 배달의민족 디자인 토큰을 실제 앱의 CSS 커스텀 프로퍼티로 옮기는 최소 계약이다. 컴포넌트 API의 필수 사양도 여기에.

**DESIGN.md의 컴포넌트 전부를 구현하지 않는다.** 이 앱에 실제 필요한 것만 채택 (Spec Assumptions).

---

## 1. CSS Custom Property Mapping (`app/globals.css`)

`:root {}` 안에서 정의. 모든 컴포넌트가 이 변수만 참조하고 하드코딩 값을 두지 않는다 (FR-201, FR-202, FR-203).

### Colors (필수)

| CSS Variable | DESIGN.md source | 용도 |
|---|---|---|
| `--color-primary` | `{colors.primary}` = `oklch(0.88 0.18 178)` | 브랜드 민트, 주요 강조 |
| `--color-primary-hover` | `{colors.primary-hover}` = `oklch(0.69 0.13 184)` | 민트 버튼 hover |
| `--color-primary-tint` | `{colors.primary-tint}` = `oklch(0.97 0.05 178)` | signedUp 배너 배경 등 |
| `--color-bg-page` | `{colors.bg-page}` = `oklch(0.97 0 286)` | body 배경 (본화이트) |
| `--color-bg-surface` | `{colors.bg-surface}` = `oklch(1 0 0)` | 카드·시트 표면 |
| `--color-bg-subtle` | `{colors.bg-subtle}` = `oklch(0.96 0 286)` | text-field resting 배경 |
| `--color-bg-inverse` | `{colors.bg-inverse}` = `oklch(0.18 0 0)` | 검정 캡슐 (검정 버튼) |
| `--color-fg-1` | `{colors.fg-1}` = `oklch(0.18 0 0)` | 주요 텍스트 (near-black) |
| `--color-fg-2` | `{colors.fg-2}` = `oklch(0.34 0 0)` | 보조 텍스트 |
| `--color-fg-3` | `{colors.fg-3}` = `oklch(0.55 0 0)` | 3차 텍스트 · placeholder |
| `--color-fg-4` | `{colors.fg-4}` = `oklch(0.71 0 0)` | disabled |
| `--color-border-1` | `{colors.border-1}` = `oklch(0.94 0 286)` | 기본 디바이더 |
| `--color-border-2` | `{colors.border-2}` = `oklch(0.87 0 286)` | 폼 인풋 보더 |
| `--color-border-strong` | `{colors.border-strong}` = `oklch(0.18 0 0)` | focus 시 강한 보더 |
| `--color-red` | `{colors.red}` = `oklch(0.63 0.24 27)` | 삭제/위험 액션, error |
| `--color-red-tint` | `{colors.red-tint}` | error 배너 배경 |
| `--color-navy` | `{colors.navy}` | 배지, 아이콘 |
| `--color-pink` | `{colors.pink}` | NEW 배지 |

### Typography (필수)

| CSS Variable | Value | 용도 |
|---|---|---|
| `--font-display` | `'BM HANNA Pro', 'BM HANNA 11yrs', system-ui, sans-serif` | 헤드라인 (H1·H2) |
| `--font-body` | `'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif` | 본문 |

**폰트 로딩**: `app/layout.js`의 `<head>`에 CDN 링크(R5).

### Spacing (필수)

4px base 12-step. `--space-1` = 4px, …, `--space-12` = 120px (DESIGN.md의 스케일 그대로).

### Rounded

| Variable | Value |
|---|---|
| `--radius-xs` | 4px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |
| `--radius-2xl` | 24px |
| `--radius-pill` | 9999px |
| `--radius-circle` | 50% |

### Elevation

| Variable | Value |
|---|---|
| `--shadow-1` | `0 1px 2px oklch(0.18 0 0 / 0.04)` |
| `--shadow-2` | `0 4px 12px oklch(0.18 0 0 / 0.06)` |
| `--shadow-3` | `0 8px 24px oklch(0.18 0 0 / 0.08)` |

### Animation

| Variable | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--dur-fast` | `120ms` |
| `--dur-base` | `200ms` |
| `--dur-slow` | `400ms` |

---

## 2. Responsive Breakpoints (필수)

CSS 미디어 쿼리로 분기 (R6):

- **모바일**: `@media (max-width: 640px)` — TopNav `display: none`, BottomTabBar `display: flex`
- **데스크톱**: `@media (min-width: 641px)` — TopNav `display: flex`, BottomTabBar `display: none`

**640-1024 사이 구간**: 데스크톱 규칙 적용(태블릿 전용 프로파일 없음, Assumptions).

---

## 3. Component Minimum Specs

각 컴포넌트의 필수 API·시각 사양. props 이름은 참고이며 구현 시 조정 가능.

### `<Button variant size fullWidth disabled>`

- **variant**: `'primary' | 'mint' | 'ghost' | 'danger'`
  - `primary`: `--color-bg-inverse` 배경, white 텍스트 (DESIGN.md `button-primary`)
  - `mint`: `--color-primary` 배경, `--color-fg-1` 텍스트 (`button-mint`)
  - `ghost`: transparent 배경, 1.5px `--color-border-2` 보더, `--color-fg-1` 텍스트 (`button-ghost`)
  - `danger`: `--color-red` 배경, white 텍스트
- **size**: `'sm' | 'md' | 'lg'` — DESIGN.md 매핑
  - sm: 40px 높이, 14px 폰트, 좌우 16px
  - md: 56px 높이, 16px 폰트, 좌우 24px (**default**)
  - lg: 64px 높이, 18px 폰트, 좌우 32px
- **shape**: 항상 `--radius-pill`
- **hover**: mint의 경우 `--color-primary-hover` 배경 + white 텍스트로 전환

**Spec**: FR-203.

### `<TextField>`

- **height**: 48px
- **radius**: `--radius-md` (12px)
- **resting**: `--color-bg-subtle` 배경, 1px `--color-border-2` 보더
- **focus**: `--color-bg-surface` 배경, 1.5px `--color-border-strong` 보더
- **font**: `--font-body` 15px
- **placeholder**: `--color-fg-3`

**Spec**: FR-208.

### `<Chip label onRemove>`

- **shape**: `--radius-pill`
- **height**: 24-28px
- **padding**: `0 10px`
- **font**: 13px 500
- **default bg**: `--color-bg-subtle`, fg `--color-fg-1`
- **removable variant**: 우측에 ✕ 버튼 (14px, `--color-fg-3`)

**Used by**: `KeywordInput.js` (FR-209).

### `<Card>`

- **background**: `--color-bg-surface`
- **radius**: `--radius-lg` (16px) 또는 `--radius-xl` (20px)
- **padding**: `--space-5` (20px) 기본
- **shadow**: 없음 또는 `--shadow-2`
- **border**: 있어도 되고 없어도 됨(선택)

**Used by**: `StudyView.js`(FR-210), 목록 행, 프로필 카드.

### `<TopNav>` (데스크톱)

- **높이**: 64px
- **좌**: 앱 타이틀 (로고/텍스트)
- **중**: 링크 3개(내 문제집·공개 문제집·프로필)
- **우**: 사용자 이름
- **배경**: `--color-bg-surface`
- **보더**: 하단 1px `--color-border-1`
- **폰트**: `--font-body`

### `<BottomTabBar>` (모바일)

- **높이**: 64px + safe-area bottom
- **탭 수**: **정확히 3개** (FR-205)
- **각 탭**: 아이콘 24px + 라벨 11px, 세로 정렬
- **활성 탭**: `--color-fg-1` 채움 아이콘 + weight 700 라벨
- **비활성 탭**: `--color-fg-3` 선 아이콘 + weight 500 라벨
- **배경**: `--color-bg-surface`
- **보더**: 상단 1px `--color-border-1`
- **safe-area**: `padding-bottom: env(safe-area-inset-bottom)` (FR-212)

### `<AppShell>` (Client Component, layout에서 사용)

- **책임**: `usePathname()`으로 현재 경로 감지
- **렌더 규칙**:
  - `/login`, `/signup`: 어떤 nav도 렌더하지 않음(어차피 미인증 진입점)
  - `/sets/*/study`, `/public-sets/*/study`: TopNav만 렌더(모바일 BottomTabBar는 숨김, R7)
  - 그 외: TopNav + BottomTabBar 둘 다 렌더(CSS로 뷰포트별 노출 제어)

**Spec**: FR-204, FR-205, FR-205b, FR-206, FR-207(footer 없음 = 컴포넌트 자체가 존재하지 않음).

---

## 4. What's OUT of Scope

이 스펙 범위에서 구현하지 않는 DESIGN.md 컴포넌트/토큰:

- `hero-slide` (마케팅 페이지 없음)
- `category-grid`, `product-card`, `list-row`(음식) (음식배달 도메인 아님)
- `service-cards`, `coupon-banner`, `coupon-card-light` (커머스 아님)
- `restaurant-row`, `search-app-bar`, `filter-chip-row`, `tab-bar-scroll` (탐색 UX 아님)
- 3D 미니어처 카테고리 아이콘, 점토 일러스트, 배달이 캐릭터 (자산 없음, 라이선스 이슈 · Assumptions)
- 배민 자체 폰트 WORK (외부 배포되지 않음)
- BM Air/Jua/Dohyeon/Yeonsung/Glim (초기 스펙 범위에서는 한나 Pro 한 종만)
- Dark mode (FR-214)
- Semantic accent 전체(discount/coupon/point/frozen/baemin-pay) — 필요한 시맨틱(에러 = red)만 최소 도입

새 컴포넌트가 필요해지면 후속 스펙에서 추가한다.

---

## 5. Validation

**SC-104** 검증 절차:
1. 브라우저 개발자도구로 `:root`의 CSS 커스텀 프로퍼티 값 확인 → DESIGN.md 값과 비교(±5%).
2. 주요 컴포넌트(Button primary, TextField, Card) 각각의 실제 렌더링 픽셀을 스크린샷 → 시각 비교.
3. `getComputedStyle`로 각 컴포넌트의 background-color, border-radius, padding 등 검증.

**SC-106** 검증: 어떤 페이지 · 어떤 뷰포트에서도 `<footer>` DOM element가 존재하지 않음(DevTools → Elements → `document.querySelector('footer')` = null).
