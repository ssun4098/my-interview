# Contract: Component Visual Specs (004 dark + chunky)

003의 Linear-tone 시각 사양 폐기. Toss/Telegram/Webtoon 앵커 기반으로 재정의. React API(props · 시그니처)는 대부분 유지되므로 페이지 파일들이 자동으로 새 시각 적용.

---

## Button (`components/Button.js`)

**API**: 유지 — `variant='primary'|'ghost'|'danger'|'link'|'green'`, `size='sm'|'md'|'lg'`, `fullWidth`, `disabled`

**Motion**: `motion.button` 사용, `whileTap={{ scale: 0.97 }}` + `SPRING.micro`.

**시각 사양**:

| Variant | 색 · 보더 |
|---|---|
| `primary` | bg `--color-primary` (Toss 블루), fg `--color-fg-1` (소프트 화이트). hover: bg `--color-primary-hover`. active: bg `--color-primary-active`. |
| `ghost` | bg `--color-bg-subtle`, fg `--color-fg-1`, 1px `--color-border-2` 보더. hover: bg `--color-bg-pressed`. |
| `danger` | bg transparent, fg `--color-danger`, 1px `--color-border-2` 보더. hover: bg `--color-danger-tint`. |
| `link` | bg transparent, fg `--color-link`, 보더 없음. |
| `green`(레거시) | primary와 동일 매핑 (Discord 시도 흔적 정리) |

**Common**:
- `border-radius: var(--radius-md)` (12px — 청키)
- `font-weight: 600`
- Height: sm=36 / md=44 / lg=52 (모바일 44px 터치 확보 → md는 기본 44)
- Padding: sm='0 14px' / md='0 20px' / lg='0 24px'

**Spec**: FR-402·FR-403·FR-412·FR-414 (44px 터치)

---

## TextField (`components/TextField.js`)

**API**: 유지 — `label`, `error`, `type`, `as`, `rows`

**시각 사양**:

| 상태 | bg | 보더 |
|---|---|---|
| Resting | `--color-bg-surface` | 1px `--color-border-2` |
| Focus | `--color-bg-surface` | 1.5px `--color-primary` + 3px `--glow-primary` outer glow |
| Error | `--color-bg-surface` | 1.5px `--color-danger` |

**Common**:
- Height 48px (모바일 44px 여유)
- `border-radius: var(--radius-md)` (12px)
- Padding: '0 14px' for input, '12px 14px' for textarea
- Font-size: 16px 모바일 (iOS zoom 방지) · 15px 데스크톱
- Placeholder: `--color-fg-3`

**Spec**: FR-402·FR-415

---

## Chip (`components/Chip.js`)

**API**: 유지 — `label`, `variant='default'|'primary'|'danger'|'success'|'mint'`, `onRemove`

**시각 사양**:

| Variant | bg | fg |
|---|---|---|
| `default` | `--color-bg-subtle` | `--color-fg-2` |
| `primary` | `--color-primary-tint` | `--color-primary-hover` |
| `mint`(legacy) | `--color-primary-tint` | `--color-primary-hover` (primary와 동일 매핑) |
| `danger` | `--color-danger-tint` | `--color-danger` |
| `success` | `rgba(0,200,83,0.14)` | `--color-success` |

**Common**:
- `border-radius: var(--radius-pill)`
- padding: '3px 10px'
- font-size: 12px, weight 600

---

## Card (`components/Card.js`)

**API**: 유지 — `as`, `padding`, `radius`, `shadow`, `border`

**시각 사양 (기본값 변경)**:

| Prop | 새 default |
|---|---|
| `padding` | `var(--space-5)` (20px, 유지) |
| `radius` | `var(--radius-lg)` (16px, 003의 10px에서 상향) |
| `shadow` | `'none'` (다크에서는 그림자 대신 색·보더로 위계) |
| `border` | `true` → 1px `--color-border-1` |
| bg | `--color-bg-surface` (내부에서 하드코딩) |

호출부에서 `<Card border={false}>` 또는 커스텀 shadow 오버라이드 가능.

---

## Sidebar (`components/Sidebar.js`)

**API**: 유지 — `profile`, `collapsed`, `onToggleCollapse`, `mobileOpen`, `onMobileOpen`, `onMobileClose`

**시각 사양 변경**:

- **Sidebar bg**: `--color-bg-surface` (다크 raised)
- **오른쪽 보더**: 1px `--color-border-1`
- **활성 nav 항목 배경**: `--color-primary-tint` (파란 tint)
- **활성 항목 좌측 accent bar**: 2px `--color-primary` (Toss 블루)
- **활성 텍스트 색**: `--color-fg-1`
- **비활성 텍스트 색**: `--color-fg-3`
- **활성 텍스트 weight**: 600
- **비활성 텍스트 weight**: 500
- **Header 로고**: font weight 700, `--color-fg-1`
- **Footer 로그아웃**: `<Button variant="ghost" size="sm" fullWidth>`
- **Collapse toggle button**: 28x28, 1px `--color-border-2` 보더, hover: `--color-bg-subtle`

**Motion**:
- 모바일 drawer: `motion.aside` + `SPRING.sheet` translateX
- Backdrop: `AnimatePresence` fade
- 데스크톱 collapse: CSS transition (width 200ms)

**Mobile top bar** (햄버거 영역):
- bg `--color-bg-surface`
- 하단 보더 1px `--color-border-1`
- 햄버거 버튼: 40x40, transparent bg
- 로고 텍스트: font 15px 700

---

## Sheet (신규 · `components/Sheet.js`)

**API**:

```jsx
<Sheet open onClose={() => setOpen(false)}>
  {children}
</Sheet>
```

**동작**:
- `AnimatePresence` 안에서 조건부 렌더
- Backdrop: fade
- Sheet body: `SPRING.sheet` translateY 0 ↔ 100%
- 스와이프 다운 (`drag="y"` + `onDragEnd`)으로 닫기 지원

**시각**:
- bg `--color-bg-elevated`
- top rounded `var(--radius-sheet)` (20px), bottom 0
- padding `var(--space-5)`
- max-height 80vh
- 상단에 얇은 grab handle (4x36 rounded, `--color-border-2`)

**이번 스펙 내 필수 사용 없음** — 확장 자리. `ConfirmDeleteForm`을 Sheet 스타일로 업그레이드하는 것은 선택 (Task로 열어둠).

---

## Skeleton (`components/Skeleton.js`)

**API**: 유지 — `width`, `height`, `radius`

**시각**:
- bg `--color-bg-subtle` (다크에서 조금 밝은 subtle)
- CSS pulse (opacity 1 ↔ 0.5) 1.5초 무한 (기존 유지)

**변경**:
- 다크에서 밝은 pulse가 잘 보이도록 base bg 값만 조정 (`rgba(255,255,255,0.05)` → `rgba(255,255,255,0.08)`)

---

## StudyView (`components/StudyView.js`)

**API**: 유지 — `questions`, `mode`, `initialIndex`, `backHref`

**시각 사양**:
- 카드 wrap: `<Card>` 사용 (라운드 16px 자동)
- 카드 padding: `var(--space-5)`
- Title: h2 스케일 (18px 700)
- Content: `--color-fg-2`, line-height 1.65
- Keywords: `<Chip variant="primary" />` 나열

**Motion**:
- 카드 래퍼가 `AnimatePresence mode="popLayout"` 안에 있음
- `key={question.id}` + direction state
- 다음/이전 액션이 direction을 -1/1로 설정
- variants: enter/exit는 x ±40px + opacity, `SPRING.page`
- 세부는 [motion.md](./motion.md) §5

**완료 화면**:
- Card wrap
- "학습 완료했습니다" 텍스트 + "문제집으로 돌아가기" `<Button variant="primary">`
- 완료 감각을 위해 카드 좌우 살짝 이동하는 subtle enter (opacity + y 8px)

---

## PageTransition (신규 · `components/PageTransition.js`)

**API**:

```jsx
<PageTransition>{children}</PageTransition>
```

**동작**:
- `useRouteDirection`으로 방향 감지
- `useMediaQuery('(max-width: 640px)')`으로 모바일 여부 감지
- `useReducedMotion`으로 접근성 확인
- 조건에 따라 mobileVariants 또는 desktopVariants를 `motion.div`에 적용
- 상세 코드는 [motion.md](./motion.md) §3

**Note**: `AnimatePresence`는 template.js에서 마운트되므로 라우트 변경마다 새 인스턴스. `mode="wait"` 대신 `mode="popLayout"` 사용 (양방향 슬라이드 동시 표현).

---

## AppShell 조정

`components/AppShell.js`는 003에서 유지되지만 최상단에 `<MotionConfig reducedMotion="user">`를 감싸서 자식 컴포넌트가 개별 처리 안 해도 되도록.

---

## icons (`components/icons/index.js`)

**변경**:
- stroke color 컨텍스트 (currentColor) 유지
- 다크 배경에서 stroke 1.75px가 너무 얇을 수 있어 `strokeWidth: 2` 로 복원 검토 (실측 후 tasks에서 확정)

---

## 폰트

- Pretendard 유지 (기존 CDN 링크 그대로)
- 헤드라인 letter-spacing만 조정: -0.02em (h1), -0.015em (h2)
