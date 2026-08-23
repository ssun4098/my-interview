# Contract: Design Tokens (Linear tone delta from 002)

002의 [design-system.md](../../002-signup-approval-redesign/contracts/design-system.md)에 정의된 CSS 커스텀 프로퍼티 세트를 기준으로, 이 스펙에서 **삭제·변경·유지**하는 항목만 나열.

---

## 삭제

| Token | 이유 |
|---|---|
| `--font-display` | Clarify Q2: BM 한나체 완전 폐기. 헤드라인이 `--font-body` 상속 |

관련 파일 변경:
- `app/layout.js`의 `<head>`에서 `BMHANNAPro.woff.css` `<link>` 제거
- `app/globals.css`의 `--font-display` 정의 및 h1/h2/h3의 `font-family` 사용 제거

---

## 변경

| Token | Old | New | 이유 |
|---|---|---|---|
| `--color-bg-page` | `oklch(0.97 0 286)` | `oklch(0.99 0 286)` | Linear에 가까운 near-white로 미묘 조정 |

---

## 유지 (그대로 사용)

- Color: `--color-primary` (mint), `--color-primary-tint`, `--color-mint-700`, `--color-bg-surface`, `--color-bg-subtle`, `--color-bg-pressed`, `--color-bg-inverse`, `--color-fg-1~4`, `--color-fg-inverse`, `--color-border-1/2/strong`, `--color-red`, `--color-red-tint`, `--color-navy`, `--color-navy-tint`, `--color-pink`, `--color-yellow`
- Typography: `--font-body`
- Spacing: `--space-1 ~ --space-12` (전체 12-step)
- Rounded: `--radius-xs ~ --radius-circle`
- Elevation: `--shadow-1/2/3` (정의는 유지하나 실제 컴포넌트 사용 최소화)
- Animation: `--ease-out`, `--ease-in-out`, `--dur-fast/base/slow`
- Layout: `--sidebar-w`, `--sidebar-w-collapsed`, `--mobile-topbar-h`, `--content-max`

---

## 새 사용 규칙 (Linear 톤)

**색 사용 제약 (핵심)**:

| 상황 | 규칙 |
|---|---|
| 브랜드 mint (`--color-primary`) 사용처 | 다음 세 곳으로 한정: (1) 주요 CTA 버튼(Mint variant), (2) TextField focus ring, (3) 사이드바 활성 항목의 좌측 2px 액센트 바 |
| 카드·컨테이너 배경 | `--color-bg-surface` (흰색) — 그림자는 기본 없음, 필요 시 `--shadow-1`만 |
| 카드 위계 표현 | 1px `--color-border-1` 보더로 처리 |
| 활성 사이드바 항목 배경 | `--color-primary-tint` 대신 `--color-bg-subtle` 사용 (더 절제) |
| 삭제·위험 액션 | `--color-red` — 텍스트/보더에만, 배경은 hover 시에만 옅게 |
| 성공·완료 안내 | mint 계열 대신 near-black 텍스트 + neutral bg. subtle 유지 |

**타이포 사용 규칙**:

| 상황 | 규칙 |
|---|---|
| h1 | 24~28px, weight 700, `--font-body`(Pretendard) |
| h2 | 18~22px, weight 700 |
| h3 | 15~16px, weight 600 |
| body | 14~15px, weight 400 |
| caption / muted | 13px, weight 400, `--color-fg-3` |
| 액션 버튼 텍스트 | 14px, weight 600 (mint 버튼은 700까지 허용) |

**그림자 사용 규칙**:

| 상황 | 규칙 |
|---|---|
| 일반 카드 | 그림자 없음 |
| 모바일 사이드바 drawer 열림 | `--shadow-3` (기존 유지) |
| 그 외 elevated surface | `--shadow-1` 정도까지만 |

---

## 검증

Constitution 및 SC 준수 확인:

- **SC-305** (브랜드 강조 색 = 1): `git grep -n "var(--color-" components/ app/`으로 mint 사용처가 위 3개 카테고리(CTA/focus/active bar) 안에 있는지 감사.
- **SC-309** (500KB gzip): 폰트 링크 1개 감소로 자연스럽게 충족. `npm run build` 리포트로 확인.
- **글로벌 미디어 쿼리**: `app/globals.css`의 `prefers-reduced-motion` 규칙이 전역에 걸려 있음.
