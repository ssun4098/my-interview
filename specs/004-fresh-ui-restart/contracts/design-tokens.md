# Contract: Design Tokens (004 dark palette)

003 스펙의 라이트/Airtable 톤 토큰 값을 대부분 교체. 이름은 대부분 유지되므로 다운스트림 컴포넌트가 자동으로 새 값 인식.

---

## Colors — 완전 재정의

`app/globals.css` `:root {}` 안에 정의.

| Token | Value | 근거 · 사용처 |
|---|---|---|
| `--color-canvas` | `#0F1218` | 페이지 배경(body). 딥 뉴트럴 + 파란 undertone (Toss/Webtoon 중간). |
| `--color-bg-page` | `#0F1218` | canvas 별칭. |
| `--color-bg-surface` | `#1A1F2E` | 카드/사이드바 raised surface. 캔버스 대비 살짝 밝음. |
| `--color-bg-elevated` | `#252B3D` | 모달·시트·팝오버. |
| `--color-bg-subtle` | `rgba(255,255,255,0.05)` | hover·활성 subtle 배경. |
| `--color-bg-pressed` | `rgba(255,255,255,0.10)` | press 상태. |
| `--color-bg-inverse` | `#F0F1F5` | 라이트 표면 (거의 사용 안 함, 흰색 버튼 등). |
| `--color-primary` | `#3182F6` | **Toss 블루** — 주 액센트. |
| `--color-primary-hover` | `#4E97F7` | 밝은 blue. |
| `--color-primary-active` | `#1B6FDB` | 진한 press. |
| `--color-primary-tint` | `rgba(49,130,246,0.14)` | 활성 사이드바·subtle button 배경. |
| `--color-fg-1` | `#F0F1F5` | 주요 텍스트 — 소프트 화이트. |
| `--color-fg-2` | `#B0B5C0` | 본문. |
| `--color-fg-3` | `#6E7383` | muted · caption. |
| `--color-fg-4` | `rgba(255,255,255,0.28)` | disabled. |
| `--color-fg-inverse` | `#0F1218` | 라이트 표면 위 텍스트. |
| `--color-border-1` | `rgba(255,255,255,0.06)` | subtle divider. |
| `--color-border-2` | `rgba(255,255,255,0.12)` | input · outline button 보더. |
| `--color-border-strong` | `rgba(255,255,255,0.24)` | 강한 강조 보더. |
| `--color-danger` | `#F04452` | 삭제·오류. |
| `--color-danger-tint` | `rgba(240,68,82,0.14)` | 오류 배너 배경. |
| `--color-success` | `#00C853` | 완료·승인 표시. |
| `--color-link` | `#4E97F7` | 인라인 링크 (primary와 tone 정렬). |

**폐기/무시**: 003의 signature-cream / signature-coral / signature-forest / signature-mint 등 배민-계열 토큰. 정의는 남길 수 있으나 사용 금지.

---

## Radius — 청키 상향

| Token | 003 | 004 | 사용처 |
|---|---|---|---|
| `--radius-xs` | 2px | 6px | 아주 작은 요소 |
| `--radius-sm` | 6px | 8px | 미세 chip, subtle 컨테이너 |
| `--radius-md` | 10px | 12px | Button · TextField 표준 |
| `--radius-lg` | 12px | 16px | Card · 큰 컨테이너 |
| `--radius-xl` | 16px | 20px | Card lg · Sheet |
| `--radius-2xl` | 20px | 28px | 시그니처 큰 카드 |
| `--radius-sheet` | (신규) | 20px | 모바일 하단 시트 상단 라운드 |
| `--radius-pill` | 9999px | 9999px | chip · 알약 버튼 |
| `--radius-circle` | 50% | 50% | 아바타 |

---

## Typography — 다크에서 살짝 두꺼워짐

| Element | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| h1 | 22px | 700 | 1.25 | -0.02em |
| h2 | 18px | 700 | 1.3 | -0.015em |
| h3 | 15px | 600 | 1.4 | -0.01em |
| body | 14~15px | 400~500 | 1.5 | 0 |
| caption / muted | 13px | 500 | 1.4 | 0.1px |
| button | 14~15px | 600 | 1.4 | 0 |
| chip | 12px | 600 | 1.4 | 0.1px |

폰트 스택은 003 유지: `'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', ...`

---

## Spacing — 003과 동일

`--space-1` (4px) ~ `--space-12` (96px) 12-step, 4px 베이스. 변경 없음.

---

## Elevation — 다크에서는 그림자 대신 border/glow

| Token | Value | 용도 |
|---|---|---|
| `--shadow-1` | `0 2px 8px rgba(0,0,0,0.35)` | subtle card lift |
| `--shadow-2` | `0 8px 24px rgba(0,0,0,0.45)` | modal · sheet |
| `--shadow-3` | `0 16px 48px rgba(0,0,0,0.55)` | drawer open |
| `--glow-primary` | `0 0 0 3px rgba(49,130,246,0.28)` | focus ring · active card halo |

**다크 배경에서 elevation은 그림자보다 색·라운드·보더 조합**이 더 잘 작동. 그림자는 rare use.

---

## Layout 변수 — 003 유지

- `--sidebar-w: 240px`
- `--sidebar-w-collapsed: 64px`
- `--mobile-topbar-h: 52px`
- `--content-max: 1200px`

---

## 검증

**SC-401** (사용자 긍정 발화) 준수 위한 팔레트 자기점검:
- Toss 계열 파란 액센트가 시각 앵커 역할 → 화면당 primary 사용처는 CTA/사이드바 활성/focus 3자리에 집중.
- 카드 라운드 16px → Toss 카드와 근접한 청키 감각.
- 헤드라인 -0.02em letter-spacing → Toss 헤드라인 tight 톤.

**SC-406** (reduced-motion) 대응은 motion.md에서 다룸.
