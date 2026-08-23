# Quickstart: 003-modern-app-ui

이 스펙은 UI 표면만 다루므로 DB 마이그레이션·env 변경이 없다. 002가 이미 배포된 상태를 전제로 한다.

---

## 1. 로컬 실행

의존성·env 변경 없음:

```bash
# 개발 서버 재시작 (변경 반영)
# Ctrl+C 후
npm run dev
```

http://localhost:3000 에서 확인.

---

## 2. 검증 시나리오 (수동)

### 2.1 US1 — Linear 톤 재정렬

**데스크톱 (1440×900)**:

1. 로그인 → `/sets`로 진입 → 좌측 사이드바가 흰 배경 + 1px 얇은 오른쪽 보더로 렌더되는지 확인. 활성 항목("내 문제집")은 subtle 회색 배경 + 좌측 얇은 mint 액센트 바(2px)가 있음.
2. 각 페이지의 카드가 그림자 없이 1px 얇은 보더로만 위계를 표현하는지 확인.
3. 주요 버튼("+ 새 문제집")이 알약(pill)이 아니라 12px radius의 얇은 라운드로 렌더되는지 확인.
4. 헤드라인(h1 "내 문제집")이 Pretendard로 렌더되는지 (한나체 사라짐) DevTools의 Computed 탭 `font-family`로 확인.
5. `document.querySelector('[href*="BMHANNAPro"]')`가 `null`인지 콘솔에서 확인 (한나체 CDN 링크 완전 제거).
6. 브랜드 mint 색을 화면에서 찾을 수 있는 곳: 사이드바 활성 액센트 바, TextField focus outline, 학습 완료 시 mint 버튼 정도. 그 외 대부분 회색·near-black·near-white.

**모바일 (375×667)**:

1. 햄버거 열기 → drawer가 왼쪽에서 오른쪽으로 200ms 슬라이드 · 백드롭 페이드인 확인.
2. 각 인풋을 탭할 때 iOS Safari에서 자동 확대되지 않는지 확인 (font-size ≥16px).
3. 버튼·링크의 터치 영역이 시각적으로 44px 이상인지 확인.

### 2.2 US2 — 앱 수준 인터랙션

1. `/sets` → `/sets/{id}` 이동 시 페이지가 위에서 6px 이동하며 페이드인 (200ms). 컷아웃 아님.
2. 어떤 버튼이든 마우스로 눌러 유지할 때 scale(0.98)로 살짝 눌리는 피드백 확인 (120ms transition).
3. 사이드바 접기 버튼 → 사이드바 너비 + 콘텐츠 여백이 동시에 200ms 전환. 라벨 텍스트 자연스럽게 사라짐.
4. 학습 모드 진입 → "다음" 3회 눌러 카드가 매번 페이드인되는지 (200ms) 확인. 이전 카드가 즉시 사라지고 새 카드가 페이드인.
5. `/sets` 진입 시 데이터 로드 잠깐 지연되는 순간 스켈레톤 카드 몇 개가 pulse 애니메이션과 함께 표시.
6. 브라우저 DevTools → Rendering 탭 → "Emulate CSS media feature prefers-reduced-motion" = reduce로 설정 → 새로고침 → 페이지 전환·마이크로 애니메이션이 모두 즉시 전환으로 대체되는지 확인.
7. Tab 키로 인터랙티브 요소 순회 시 mint 색 outline이 각 요소에 명확히 표시되는지 확인 (focus-visible).

### 2.3 성능·번들 (SC-309)

```bash
npm run build
```

리포트에서:
- "First Load JS shared by all"이 200KB 이하 유지 (framer-motion 등 도입하지 않았으므로 변화 미미)
- 새로 추가된 `/template` 관련 청크가 눈에 띄게 크지 않은지 확인

브라우저 DevTools Network 탭 → 첫 방문 시 로드된 폰트 요청이 Pretendard 하나만 있는지 확인 (BM 한나체 요청 없음).

---

## 3. Vercel 배포 확인

DB 변경이 없으므로 별도 절차 없이 `git push`로 자동 배포. 배포 후 URL에서 위 §2 재확인.

---

## 4. 문제 발생 시

- **페이지 전환 애니메이션이 안 보임**: `app/template.js`가 `'use client'` 지시어를 갖고 있는지, `className="page-transition"`이 `.page-transition` CSS 규칙과 매칭되는지 확인.
- **한나체가 여전히 로드됨**: 브라우저 캐시. Hard reload (Ctrl+Shift+R) 또는 시크릿 창.
- **사이드바 활성 상태가 안 보임**: 활성 항목의 좌측 2px mint 액센트 바는 매우 얇음. subtle 회색 배경과 합쳐서 확인.
- **focus outline이 안 보임**: 마우스 클릭 시엔 `:focus-visible`이 발동하지 않음(정상). Tab 키로 순회하며 확인.
