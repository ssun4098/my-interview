# Quickstart: 004-fresh-ui-restart

이 스펙은 UI 표면 + 모션 재정렬만 다루므로 DB 마이그레이션 · env 변경 없음. 002·003이 이미 셋업된 상태를 전제.

---

## 1. 의존성 추가

```bash
npm install motion
```

- `motion`은 framer-motion의 후속 이름. `motion/react` 서브패키지로 React 사용.
- 기존 `package.json`에 추가되어야 함. 신규 devDependency 없음.

---

## 2. 로컬 실행

env 변경 없음:

```bash
# Ctrl+C 후
npm run dev
```

http://localhost:3000 에서 확인.

---

## 3. 검증 시나리오 (수동)

### 3.1 US1 — 모던하고 감각적인 시각 (다크 · 청키 · Toss 블루)

**데스크톱 (1440×900)**:

1. `/login` 진입 → 딥 뉴트럴 다크 캔버스 · Toss 블루 primary 버튼 · 청키 라운드(12px 버튼, 16px 카드) 확인.
2. 로그인 → `/sets` → 카드가 raised 다크 표면(`#1A1F2E`)에 얇은 보더로 표시. Toss 카드 감각 확인.
3. 사이드바 활성 항목: 파란 tint 배경(`rgba(49,130,246,0.14)`) + 좌측 2px Toss 블루 accent bar.
4. 헤드라인이 tight letter-spacing으로 렌더 (h1 -0.02em) — Toss 헤드라인 톤.
5. `/sets/[id]/study?mode=study&i=0` 진입 → 문제 카드가 청키하게 담김.
6. 어떤 화면에서도 footer 없음 확인.

**모바일 (375×667, DevTools Responsive)**:

1. 상단 mobile top bar 다크 톤 · 햄버거 아이콘 명확.
2. 모든 인풋 높이 44+px, 자동 확대 없음.
3. 카드 라운드가 청키하게 인식.

### 3.2 US2 — 자연스러운 앱-감각 모션

**모바일**:

1. `/sets` → `/sets/[id]` 이동 → 새 화면이 오른쪽에서 슬라이드인, 이전 화면이 왼쪽으로 살짝 밀림(parallax 30%). 스프링 감쇠로 자연스럽게 착지.
2. 브라우저 뒤로 가기 (또는 앱 안의 "뒤로") → 반대 방향(왼쪽에서 -30%에서 나옴, 이전 화면 오른쪽으로 슬라이드아웃).
3. `/sets` → `/public-sets` 이동 (sibling 라우트) → 방향성 없이 crossfade.
4. 사이드바 햄버거 탭 → drawer가 스프링으로 밀려나옴 (딱딱한 CSS 슬라이드 아님). 백드롭 fade in.
5. 백드롭 탭 · 나열 항목 탭 → drawer가 스프링으로 닫힘.
6. `/sets/[id]/study` 진입 → 카드 → "다음" 누르면 카드가 왼쪽으로 나가고 다음 카드가 오른쪽에서 들어옴. "이전"은 반대.
7. 모든 버튼 tap 시 `scale(0.97)` 스프링 반응.
8. iOS Safari로 실기 확인 (가능한 경우): 스와이프 뒤로 가기 제스처와 우리 애니메이션이 방향 일치, 이중 이동감 없음.

**데스크톱**:

1. 라우트 이동 시 방향성 슬라이드 없이 절제된 fade + 6px 슬라이드만.
2. 사이드바 collapse 토글: 240px ↔ 64px CSS transition (기존 그대로).
3. `<Tab>`으로 순회: focus outline이 Toss 블루로 명확히 표시.

**reduced-motion 사용자**:

1. DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" = reduce
2. 새로고침 후 라우트 이동 · 사이드바 열기 · 카드 넘기기 → 모든 motion이 즉시 전환으로 대체.

### 3.3 성능 · 번들 (SC-407)

```bash
npm run build
```

리포트에서:
- "First Load JS shared by all"에 `motion` 청크가 추가되어 30~40KB 증가 예상 (~120~130KB 총).
- SC-407 500KB gzip 예산 안에 여전히 여유 있어야 함.

Network 탭에서:
- Pretendard 폰트만 로드 (BM 한나체 없음).
- motion chunk가 페이지 진입 시 로드됨.

---

## 4. Vercel 배포

DB 변경 없음 → `git push`로 자동 배포. 배포 후 위 §3 재확인.

---

## 5. 문제 발생 시

- **motion 라이브러리 못 찾음**: `npm install motion` 재실행. `package.json`에 등록 확인.
- **AnimatePresence exit 애니메이션이 안 보임**: `mode="popLayout"`이 설정되어 있는지 확인. `key` prop이 라우트마다 변하는지 확인.
- **모바일에서 방향성이 반대**: `useRouteDirection`의 pathname 깊이 비교 로직 확인. `filter(Boolean)`이 빠지면 첫 세그먼트에서 계산 어긋남.
- **iOS Safari에서 이중 이동감**: `popstate` 감지가 안 되면 duration을 짧게 축소하는 로직 확인.
- **다크에서 텍스트가 지나치게 얇음**: 헤드라인 weight를 700 → 800으로, 본문 400 → 500으로 상향. 다크에서 얇은 폰트는 optical 얇아 보임.
- **Toss 블루가 지나치게 튐**: primary 사용처를 CTA/사이드바 활성/focus 3자리로 제한. 카드/보더 등에 primary 넣지 말 것.
