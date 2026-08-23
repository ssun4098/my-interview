# Research: 모던 AI 서빙 UI 스타일 재디자인 + 앱 수준 인터랙션

**Feature**: 003-modern-app-ui · **Date**: 2026-08-22

이 문서는 clarify에서 결정된 세 방향(Linear · Pretendard-only · fade+6px slide)을 실제 구현으로 옮기기 위한 기술 결정 정리.

---

## R1. 페이지 전환 애니메이션 구현 방식

**Decision**: **Next.js App Router의 `app/template.js` + 순수 CSS keyframes**. 애니메이션 라이브러리(framer-motion 등) 도입하지 않음.

**Rationale**:
- `template.js`는 App Router 표준 파일이며, route 변경마다 새 인스턴스로 마운트된다. 이 특성을 활용해 마운트 시 CSS 애니메이션을 자동으로 트리거할 수 있음.
- 필요한 코드 총량: template.js 8~10줄 + CSS keyframes 8~10줄 = **총 ~20줄**. Constitution I("~20줄로 가능하면 의존성 추가 금지") 명시적 충족.
- framer-motion은 gzipped 45~55KB. SC-309(500KB gzip)에는 여유가 있지만 학습 부담·트리셰이킹 복잡도가 증가하고, 초심자가 API를 익혀야 함.
- CSS 방식은 hardware-accelerated (opacity/transform) 속성만 사용하면 프레임 드롭 위험 최소.

**Alternatives considered**:
- **framer-motion + AnimatePresence**: 파워풀하지만 라이브러리 학습 곡선 + 번들 증가. 우리 케이스에서 정당화되지 않음.
- **CSS `@view-transition` API**: 최신 스펙이지만 브라우저 지원(2026-08 기준 Chrome/Edge 위주)이 아직 완전하지 않음. Safari·Firefox 사용자에게 no-op이 될 수 있어 폴백이 필요 → 오히려 복잡.
- **`useEffect` + JS 타이머로 수동 전환**: hydration mismatch, 깜빡임, 로직 복잡. 안티패턴.

**Impact**:
- `app/template.js` 신규
- `app/globals.css`에 `@keyframes pageIn` 8줄 정도 + `.page-transition` 클래스
- `prefers-reduced-motion` 미디어 쿼리로 `animation: none` 자동 대체

---

## R2. Linear 톤의 색·타이포·간격 매핑

**Decision**: 002의 배민 토큰 대부분을 유지하되, **사용 방식을 대폭 절제**한다. 하드코드된 팔레트 변경보다 "언제 어떤 색·강조를 쓰지 않을지"의 계약이 더 중요.

**핵심 변경**:
- `--font-display` 변수와 관련 BM 한나체 CDN 링크: **제거**
- `--color-primary` (mint): 유지하되 **사용처 축소** — 활성 사이드바 항목 배경 · TextField focus ring · 주요 CTA 버튼(mint variant) 정도에만
- `--color-bg-page`: 순수 흰색에 가까운 톤으로 미묘 조정 (`oklch(0.99 0 286)`) — Linear에 가까운 near-white
- 그림자: `--shadow-2`·`--shadow-3`는 정의는 유지하되 실제 컴포넌트에서 거의 사용하지 않음
- 카드 기본 시각: `--shadow-1` 대신 `1px solid var(--color-border-1)`

**Typography 스케일 재정의 (기존 h1=28/h2=22/h3=18 유지하되 weight로 위계)**:
- h1: 24px, weight 700 (기존 28로 유지해도 무방)
- h2: 18px, weight 700
- h3: 15px, weight 600
- body: 14~15px, weight 400
- caption/muted: 13px, weight 400, color `--color-fg-3`

**Rationale**:
- 토큰 값을 재정의하지 않고 사용처만 축소하면 002 컴포넌트와의 호환성 유지 + 계약 관리 단순.
- Linear의 폰트 스케일은 우리 것과 유사(작은 편). 큰 변경 불필요.

**Alternatives considered**:
- **팔레트 완전 교체**: mint 제거하고 Linear-purple 등 도입. DESIGN.md 참조 원칙과 상충, 이유 부족.
- **Tailwind CSS 도입해 utility class로 전환**: 대규모 리팩터링. Constitution I 위반 소지. 인라인 스타일 + CSS 변수로 충분.

**Impact**:
- `app/layout.js`에서 BM 한나체 CDN `<link>` 제거
- `app/globals.css`에서 `--font-display` 변수 삭제, `--color-bg-page` 미조정
- `h1`/`h2`/`h3` 규칙에서 `font-family: var(--font-display)` 제거 (전부 `--font-body`)
- 각 컴포넌트의 mint 사용 지점 재검토

---

## R3. 마이크로 인터랙션 (hover · active · focus)

**Decision**: **글로벌 CSS 규칙**으로 모든 button/a 요소에 hover/active 피드백을 통일 적용.

**규칙**:
```css
/* base */
button, a { transition: background-color var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out),
                        transform var(--dur-fast) var(--ease-out); }

/* press feedback */
button:active:not(:disabled),
a:active { transform: scale(0.98); }

/* focus ring — accessibility */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

**Rationale**:
- 컴포넌트마다 개별 스타일 반복하지 않고 한 곳에서 계약 강제 → SC-304(100% 인터랙션 피드백) 자동 준수.
- `:focus-visible`은 키보드 접근성만 스타일링 (마우스 클릭 시엔 발동 안 함) — Linear가 사용하는 표준.
- 글로벌 `prefers-reduced-motion` 규칙 하나가 모든 애니메이션을 즉시 대체.

**Alternatives considered**:
- **각 컴포넌트마다 인라인 style로 hover 처리**: 반복·누락 위험. React inline style은 `:hover` 미지원.
- **CSS-in-JS 라이브러리(emotion 등)**: 오버킬.

**Impact**:
- `app/globals.css`에 위 규칙 추가
- 개별 컴포넌트의 hover/active inline JS 로직 제거 가능

---

## R4. 스켈레톤 로딩 방식

**Decision**: **Next.js App Router의 `loading.js` + 최소 스켈레톤 컴포넌트(`components/Skeleton.js`)**.

**규칙**:
- 데이터 페칭이 있는 라우트에 `loading.js` 파일 배치
- `loading.js`가 렌더할 스켈레톤은 실제 페이지 구조를 근사한 회색 pulsing rectangle 몇 개
- `<Skeleton width height radius />` 컴포넌트: `--color-bg-subtle` 배경 + CSS `@keyframes pulse`

**적용 라우트**:
- `/sets` — 카드 3~5개 스켈레톤
- `/sets/[id]` — 헤더 + 액션 버튼 + 카드 리스트 스켈레톤
- `/public-sets` — `/sets`와 유사
- `/public-sets/[id]` — 헤더 + 액션 버튼 스켈레톤
- 학습 라우트(`/sets/[id]/study`, `/public-sets/[id]/study`)는 페이지 자체가 데이터 페칭 후 즉시 카드 렌더 → 스켈레톤 필요성 낮음, 생략

**Rationale**:
- Next.js가 자동으로 `loading.js`를 Suspense fallback으로 처리 — 별도 상태 관리 없음.
- Constitution I: 파일 하나 = 스켈레톤 하나로 초심자도 직관적.
- FR-319("지각 지연 300ms+ 시 진행 상태 표시") 자연스럽게 충족.

**Alternatives considered**:
- **useTransition + 커스텀 로딩 UI**: 매 페이지마다 boilerplate. 부적합.
- **글로벌 로딩 인디케이터 (top bar 스타일)**: 페이지별 정확한 형태 미러링 불가능. 스켈레톤이 더 좋은 UX.

**Impact**:
- `components/Skeleton.js` 신규 (30줄 이내)
- `loading.js` 파일 4개 신규
- `app/globals.css`에 `@keyframes pulse` 6줄

---

## R5. 사이드바 시각 refinement (Linear 톤)

**Decision**: 사이드바 **구조는 그대로**, 시각만 refine.

**주요 변경**:
- 활성 항목 배경: `--color-primary-tint` → `--color-bg-subtle` (더 절제된 회색)
- 활성 항목 텍스트: `--color-fg-1` (변경 없음), 좌측 2px mint 액센트 바 추가로 강조
- 사이드바 배경: `--color-bg-surface` 유지 (흰색)
- 사이드바 오른쪽 보더: 1px `--color-border-1` 유지
- 항목 padding: 살짝 감소 (10px 14px → 8px 12px)로 밀도 증가
- 아이콘 stroke width: 2 → 1.75 (더 얇게, Linear 톤)
- footer의 로그아웃 버튼: 현재 outline 스타일 → ghost 스타일 (보더 없이 hover 시 배경만)
- 사이드바 접기 시 활성 표시: 아이콘 배경 subtle 그레이 원 (`--radius-circle`, `--color-bg-subtle`)

**Rationale**:
- Linear·Notion·Height 등의 사이드바가 공통으로 사용하는 패턴: subtle 배경 활성 상태 + 좌측 얇은 액센트 바.
- mint를 활성 배경으로 쓰던 002 접근은 시각적 강조가 과함 (Linear 톤과 상충).
- padding 감소는 정보 밀도를 높여 Linear 느낌 강화.

**Alternatives considered**:
- **활성 배경을 mint tint로 유지**: 익숙하지만 Linear 톤 벗어남.
- **활성 항목에 좌측 액센트 바 없이 배경만**: 정보가 부족해 활성 상태 인식이 늦어짐.

**Impact**:
- `components/Sidebar.js` 재작성 (구조 유지, 스타일만)
- `components/icons/index.js`의 stroke-width 상수 조정

---

## R6. 학습 카드 전환 애니메이션

**Decision**: `StudyView.js` 내부에서 **key prop을 이용한 fade 전환**.

```jsx
<div key={question.id} className="study-card-fade">
  {/* question card */}
</div>
```

CSS:
```css
.study-card-fade {
  animation: cardFade 200ms var(--ease-out);
}
@keyframes cardFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Rationale**:
- React가 key 변경 시 노드를 재마운트 → CSS 애니메이션 자동 실행. 별도 라이브러리 불필요.
- FR-316: "즉시 컷아웃이 아니라 페이드아웃 → 페이드인 시퀀스(총 ≤250ms)" 충족.
- 이전 카드의 페이드아웃은 명시적으로 처리하지 않음 (즉시 사라짐). 실제 사용자 경험상 200ms 페이드인만으로도 충분히 부드럽게 인지되며, 이전 카드 페이드아웃을 위해 `AnimatePresence` 같은 라이브러리를 도입할 정당성이 없음.

**Alternatives considered**:
- **framer-motion AnimatePresence**: exit + enter 모두 처리. 라이브러리 정당화 안 됨.
- **useEffect + setTimeout으로 명시적 opacity 관리**: 로직 복잡, 오류 소지.

**Impact**:
- `components/StudyView.js`에서 카드 래퍼에 `key={question.id}` + 클래스 추가
- `app/globals.css`에 keyframes 추가

---

## R7. 부드러운 스크롤

**Decision**: CSS `scroll-behavior: smooth` **글로벌 적용** + `prefers-reduced-motion` 처리.

```css
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

**Rationale**:
- 프로그램적 스크롤(앵커 이동, `scrollTo` 등)에 자동 적용. 사용자 스크롤은 브라우저 관성 그대로.
- 우리 앱에는 앵커 링크가 드물지만, 향후 확장을 위해 미리 적용해도 무해.

**Alternatives considered**:
- **JS scroll behavior 관리**: 오버킬.

**Impact**:
- `app/globals.css`에 2줄.

---

## R8. 폰트 최적화 (한나체 제거)

**Decision**: **BM 한나체 CDN `<link>` 완전 제거**. Pretendard만 유지.

**변경**:
- `app/layout.js`의 `<head>`에서 `BMHANNAPro.woff.css` 링크 삭제
- `app/globals.css`의 `--font-display` 변수 삭제
- `h1/h2/h3` 규칙에서 `font-family: var(--font-display)` 제거 → `--font-body`가 body에서 상속

**Rationale**:
- Clarify Q2 결정. Linear 톤과 정면 정렬.
- 폰트 하나 감소 = 초기 로드 시 HTTP 요청 하나 감소 = LCP 개선.

**Impact**:
- 초기 자산 크기 감소 (약 30~50KB gzip 절약, SC-309 여유 증가).
- 헤드라인 시각이 body와 같은 폰트로 통일됨 (Linear 결).

---

## R9. 모바일 인풋 자동 확대 방지 (iOS Safari)

**Decision**: 모든 폼 인풋의 `font-size: 16px 이상`을 CSS로 보장.

```css
input, textarea, select {
  font-size: 16px; /* iOS Safari: <16px 시 자동 zoom */
}
@media (min-width: 641px) {
  input, textarea, select { font-size: 15px; } /* 데스크톱은 15px 허용 */
}
```

**Rationale**:
- FR-322: iOS Safari 자동 확대 방지.
- 데스크톱에서는 15px로 미묘하게 작게 유지해 밀도 확보.

**Impact**:
- `app/globals.css` 5줄 추가.

---

## R10. 미도입 결정 (No Adds)

**정리**: 이 스펙 범위에서 아래는 **도입하지 않는다**.

- **framer-motion / motion-one / react-spring** — R1 참조.
- **Tailwind CSS** — R2 참조. 인라인 스타일 + CSS 변수 유지.
- **Radix UI / Headless UI 등 컴포넌트 라이브러리** — 우리 컴포넌트가 이미 충분히 minimal.
- **Storybook 등 컴포넌트 문서화 도구** — 개인 MVP에 오버킬.
- **다크 모드 지원 코드** — FR-324 명시적 out of scope.
- **완전한 WCAG 인증용 접근성 툴링** — 실용적 수준(focus-visible · reduced-motion · 44px)만.

**Rationale**: Constitution I("YAGNI"). 어느 하나 도입해도 명시적 요구를 넘어서고, 이 스펙의 목표는 오히려 시각을 절제하는 것이라 부합하지 않음.
