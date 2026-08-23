# Contract: Component Visual Specs (Linear tone)

기존 컴포넌트의 시각 사양을 Linear 톤으로 재정렬. React API(props · 시그니처)는 유지.

---

## Button (`components/Button.js`)

**API**: 변경 없음 — `variant='primary'|'mint'|'ghost'|'danger'`, `size='sm'|'md'|'lg'`, `fullWidth`, `disabled`

**시각 사양 변경**:

| Variant | 색·보더·hover | 사용처 |
|---|---|---|
| `primary` | bg=`--color-bg-inverse` (near-black), fg=white. hover: bg opacity 0.9. | 확인/저장 등 강한 CTA |
| `mint` | bg=`--color-primary`, fg=`--color-fg-1`. hover: bg=`--color-primary-hover`, fg=white. | 최상위 강조 (예: "학습 시작", "다음") — 매우 드물게 |
| `ghost` | bg=transparent, 1px border=`--color-border-2`, fg=`--color-fg-1`. hover: bg=`--color-bg-subtle`. | 보조 액션 (편집·목록으로) — 가장 많이 사용 |
| `danger` | bg=transparent, 1px border=transparent, fg=`--color-red`. hover: bg=`--color-red-tint`. | 삭제 액션 |

**공통 사양**:
- `border-radius: var(--radius-md)` (12px) — 알약 대신 얇은 라운드 (Linear 톤). **알약 스타일은 폐기.**
- `font-weight: 600` (Linear의 subtle CTA 톤)
- Height: sm=36px / md=40px / lg=48px — **002보다 4~8px 낮춤** (Linear는 컴팩트)
- Padding: sm='0 12px' / md='0 16px' / lg='0 20px'

**전환**: 글로벌 `button` 규칙(motion.md §5)이 hover·active 처리. 컴포넌트에서 개별 transition 정의 안 함.

---

## TextField (`components/TextField.js`)

**API**: 변경 없음 — `label`, `error`, `type`, `as='input'|'textarea'`, `rows`

**시각 사양 변경**:

| 상태 | 배경 | 보더 |
|---|---|---|
| Resting | `--color-bg-surface` (흰색) — 002의 subtle bg 대신 흰색 | 1px `--color-border-2` |
| Focus | `--color-bg-surface` | 1px `--color-border-strong` + `outline: 2px --color-primary; outline-offset: 2px` |
| Error | `--color-bg-surface` | 1px `--color-red` |

**공통 사양**:
- Height: input=40px (002의 48px에서 축소) / textarea min-height 별도
- Radius: `--radius-md`
- Padding: input='0 12px' / textarea='10px 12px'
- Font-size: 16px (모바일 iOS zoom 방지, R9), 데스크톱 CSS에서 15px 오버라이드

**Note**: focus 시 outline은 글로벌 focus-visible 규칙에서 이미 처리되므로 컴포넌트 개별 로직 없어도 됨. `useState`로 focused 관리하는 004 이전 로직은 제거 가능 (CSS `:focus` selector로 대체).

---

## Chip (`components/Chip.js`)

**API**: 변경 없음 — `label`, `variant='default'|'mint'|'danger'|'navy'`, `onRemove`, `removeLabel`

**시각 사양 변경**:

| Variant | bg | fg |
|---|---|---|
| `default` | `--color-bg-subtle` | `--color-fg-2` (기존 fg-1보다 옅게) |
| `mint` | `--color-primary-tint` | `--color-mint-700` |
| `danger` | `--color-red-tint` | `--color-red` |
| `navy` | `--color-navy-tint` | `--color-navy` |

**공통 사양**:
- `border-radius: var(--radius-pill)` (알약 유지 — chip은 알약이 자연스러움)
- Padding: '2px 8px' (기존 '4px 12px'에서 축소)
- Font-size: 12px (기존 13px에서 축소)
- Font-weight: 500

---

## Card (`components/Card.js`)

**API**: 변경 없음 — `as`, `padding`, `radius`, `shadow`, `border`

**시각 사양 변경**:

| Prop | 새 default |
|---|---|
| `padding` | `var(--space-5)` (변경 없음) |
| `radius` | `var(--radius-lg)` (16px) 유지 |
| `shadow` | **`'none'`** (기존: `'var(--shadow-1)'`) |
| `border` | **`true`** (기존: `false`) — 1px `--color-border-1` |

호출부에서 `<Card shadow="var(--shadow-2)" border={false}>` 처럼 명시적으로 오버라이드 가능 (드문 케이스).

---

## Sidebar (`components/Sidebar.js`)

**API**: 변경 없음 — `profile`, `collapsed`, `onToggleCollapse`, `mobileOpen`, `onMobileOpen`, `onMobileClose`

**시각 사양 변경**:

**Nav item**:
- Padding: '8px 12px' (기존 '10px 14px'에서 축소, 밀도 증가)
- Margin: '2px 8px' (기존 '2px 10px')
- Radius: `var(--radius-md)`
- **활성 상태 배경**: `--color-primary-tint` → `--color-bg-subtle` (더 절제)
- **활성 상태 좌측 액센트 바**: 2px, 전체 높이, `--color-primary`, `border-radius: 2px` — position absolute로 좌측 -1px 위치. **이것이 유일한 mint 강조**.
- 활성 텍스트 weight: 500 → 600
- 아이콘 크기: 20px 유지, stroke-width는 1.75로 (R5)

**Header (로고 영역)**:
- Padding: '12px 12px' (기존 '16px 16px'에서 축소)
- 로고 텍스트: font-size 15px, weight 700

**Footer (username + 로그아웃)**:
- Logout button: `<Button variant="ghost" size="sm">` 형태로 통일 (자체 인라인 스타일 대신)
- Username: font-size 12px, `--color-fg-3`

**Collapse toggle button**:
- 28x28 유지
- 얇은 보더 (1px `--color-border-1`)
- hover: `--color-bg-subtle`

**Mobile top bar** (햄버거 영역): 변경 없음.

---

## Skeleton (`components/Skeleton.js`) — 신규

**API**:

```jsx
<Skeleton width="100%" height={16} radius={4} />
```

- `width`: 문자열/숫자, 기본 `'100%'`
- `height`: 필수, 문자열/숫자
- `radius`: 기본 `4` (px)

**렌더**: 하나의 `<div>`, `background: var(--color-bg-subtle)`, motion.md §6의 pulse 애니메이션.

**사용처**: `loading.js` 안에서 페이지 구조를 근사.

**예시**:

```jsx
// app/sets/loading.js
import Skeleton from '@/components/Skeleton';
import Card from '@/components/Card';

export default function Loading() {
  return (
    <>
      <Skeleton width={120} height={28} />
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton width="60%" height={16} />
            <div style={{ marginTop: 8 }}>
              <Skeleton width="30%" height={12} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
```

---

## KeywordInput / QuestionSetForm / QuestionForm (미미한 조정)

내부에서 사용하는 `<Chip>`, `<TextField>`, `<Button>`이 이미 재스타일링되었으므로 대부분 자동으로 새 톤 반영. 유일한 조정 지점:

- **KeywordInput**: 자체 인라인 입력창 스타일이 있음. 이걸 새 TextField 사양(height 40px, border 1px `--color-border-2`)과 정렬.
- **폼 컨테이너**: 폼 요소 사이 gap을 `var(--space-4)` (16px) → `var(--space-3)` (12px)로 축소 (밀도).
- **에러 메시지**: 기존 mint tint 배경 대신 `--color-red-tint` + `--color-red` 텍스트 유지.

---

## StudyView (`components/StudyView.js`)

**API**: 변경 없음 — `questions`, `mode`, `initialIndex`, `backHref`

**시각 사양 변경**:
- 카드 자체: `<Card>`를 사용하되 shadow=none, border=true (default 그대로).
- **새 애니메이션**: 카드 래퍼에 `key={question.id}` + `className="study-card-fade"` 추가.
- 이전/다음 버튼: 기존 `<Button variant="ghost">`/`<Button variant="mint">` 조합 유지, 단 mint 사용을 "완료" 상태에서만 강조 (일반 "다음"은 primary variant로 절제).
- 완료 화면: 기존 Card + 텍스트 유지, 텍스트 톤을 `--color-fg-2`로 살짝 낮춰 은은하게.

---

## icons (`components/icons/index.js`)

**변경**: `strokeWidth: 2` → `strokeWidth: 1.75` (base 상수 조정). Linear의 아이콘 톤 근사.

`svgProps` 헬퍼에서 관리되므로 한 곳만 수정.

filled 아이콘은 변경 없음.
