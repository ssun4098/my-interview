# my-interview

Next.js + Supabase 기반의 개인용 면접 준비 웹앱. Vercel에 배포합니다.

이 README는 Next.js를 처음 다루는 사용자를 위해 폴더 구조 · 환경 변수 · 로컬 실행 · Vercel 배포 절차를 한 곳에 모아둔 온보딩 문서입니다. 프로젝트의 규칙(원칙)은 [.specify/memory/constitution.md](.specify/memory/constitution.md)에 정리되어 있습니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: JavaScript (TypeScript 사용하지 않음)
- **백엔드/DB/인증/스토리지**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **모션**: `motion` (formerly framer-motion) — iOS 스타일 페이지 전환 · 스프링 드로어 · 학습 카드 direction-aware
- **호스팅**: Vercel

## 폴더 구조 (최대한 단순)

```text
my-interview/
├── app/                                # 라우트 = 폴더. 페이지 = 폴더 안의 page.js
│   ├── layout.js                       # 루트 레이아웃 (AppShell 포함, footer 없음)
│   ├── template.js                     # 페이지 전환 애니메이션 (fade + 6px slide)
│   ├── page.js                         # 홈("/") — 로그인 여부에 따라 리다이렉트
│   ├── globals.css                     # 전역 스타일 · 디자인 토큰 · 애니메이션
│   ├── (auth)/
│   │   ├── login/page.js               # "/login"
│   │   └── signup/page.js              # "/signup"
│   ├── sets/                           # 내 문제집
│   │   ├── page.js                     # "/sets" 목록
│   │   ├── loading.js                  # 스켈레톤 로딩
│   │   ├── new/page.js
│   │   └── [id]/
│   │       ├── page.js                 # "/sets/:id" 상세
│   │       ├── loading.js
│   │       ├── edit/page.js
│   │       ├── study/page.js           # "?mode=study|memorize&i=N"
│   │       └── questions/
│   │           ├── new/page.js
│   │           └── [qid]/edit/page.js
│   ├── public-sets/                    # 공개 문제집 둘러보기
│   │   ├── page.js                     # "/public-sets"
│   │   ├── loading.js
│   │   └── [id]/
│   │       ├── page.js
│   │       ├── loading.js
│   │       └── study/page.js
│   └── profile/
│       └── page.js                     # "/profile" (사이드바 3번째 탭)
├── components/                         # 재사용 UI
│   ├── AppShell.js                     # 사이드바 + 콘텐츠 영역 컨테이너
│   ├── Sidebar.js                      # 좌측 접이식 사이드바 (모바일 스프링 드로어)
│   ├── PageTransition.js               # iOS 스타일 라우트 전환 (motion)
│   ├── Sheet.js                        # 모바일 하단 시트 (motion, 확장 자리)
│   ├── Button.js                       # primary/ghost/danger/link/white 변형 (motion whileTap)
│   ├── TextField.js                    # 다크 인풋 + Toss 블루 focus glow
│   ├── Chip.js                         # 알약 태그 (default/primary/danger/success)
│   ├── Card.js                         # raised 다크 표면, 16px 라운드
│   ├── Skeleton.js                     # 로딩용 pulse 사각형
│   ├── ConfirmDeleteForm.js            # Server Action + 확인 다이얼로그 래퍼
│   ├── QuestionSetForm.js              # 문제집 생성/편집 공용
│   ├── QuestionForm.js                 # 문제 생성/편집 공용
│   ├── KeywordInput.js                 # 콤마/엔터로 chip 분리
│   ├── StudyView.js                    # 학습/암기 모드 (motion direction-aware)
│   └── icons/index.js                  # 인라인 SVG 아이콘 세트
├── lib/                                # 순수 JS 헬퍼
│   ├── supabase-browser.js             # 브라우저용 Supabase 클라이언트
│   ├── supabase-server.js              # 서버용 Supabase 클라이언트 (쿠키)
│   ├── supabase-admin.js               # 관리자 클라이언트 (service role, signUp 우회)
│   ├── username.js                     # 아이디 정규화 · 합성 이메일 변환
│   ├── profile.js                      # 현재 사용자 프로필 조회 (is_approved 포함)
│   ├── motion.js                       # SPRING 프리셋 + useRouteDirection + useIsMobile
│   ├── auth-actions.js                 # signUp / signIn / signOut Server Actions
│   ├── set-actions.js                  # 문제집 CRUD Server Actions
│   ├── question-actions.js             # 문제 CRUD Server Actions
│   └── queries.js                      # 학습 뷰용 조회 헬퍼
├── supabase/
│   └── schema.sql                      # ★ Supabase SQL Editor에서 직접 실행
├── public/
│   └── favicon.svg                     # 앱 파비콘
├── middleware.js                       # 인증 세션 · 승인 상태 게이트
├── .env.example
├── .env.local                          # gitignored
├── .gitignore
├── .eslintrc.json
├── jsconfig.json                       # 경로 별칭 "@/*"
├── next.config.js
├── package.json
└── README.md
```

### 디자인 · 인터랙션 톤

**앵커**: **Toss** · **Naver Webtoon** · **텔레그램** — 세 앱의 공통 결(모바일-우선 앱 감각 · 파란 액센트 · 청키 컨테이너 · 스프링 모션 · 크롬 최소화).

- **비주얼**: 다크 온리 (딥 뉴트럴 캔버스 `#0F1218` · Toss 블루 primary `#3182F6` · 소프트 화이트 텍스트 `#F0F1F5`)
- **컨테이너**: 청키한 라운드 (버튼 12px · 카드 16px · 시트 20px)
- **타이포**: Pretendard 단일 스택, weight 상향 (h1 700 · body 400~500)
- **모션** (motion 라이브러리): 모바일 iOS-스타일 direction-aware 좌우 슬라이드 + parallax + spring · 사이드바 스프링 드로어 · 학습 카드 direction-aware 전환 · 버튼 press whileTap
- **접근성**: `MotionConfig reducedMotion="user"`로 자동 대응 · 44px 최소 터치 영역 · `:focus-visible` Toss 블루 outline · iOS Safari 스와이프 뒤로 가기 정합

핵심 규칙:

- **`app/` 폴더 하나에서 모든 라우트를 만든다.** 예전 `pages/` 방식은 쓰지 않습니다.
- **폴더 이름이 URL이 됩니다.** `app/sets/[id]/page.js` → `/sets/:id`.
- **재사용 UI만 `components/`로 뺍니다.** 한 페이지에서만 쓰는 컴포넌트는 그냥 그 페이지 파일 안에 둡니다.
- **서버 전용 코드와 클라이언트 코드를 섞지 않습니다.** 상단에 `'use client'`가 있으면 브라우저에서 실행되고, 없으면 서버에서 실행됩니다. Server Actions 파일에는 `'use server'`가 있습니다.
- **DB 스키마 관리에는 마이그레이션 도구를 쓰지 않습니다.** `supabase/schema.sql` 한 파일이 정본이고, 변경 시 파일을 갱신한 뒤 Supabase 대시보드에서 다시 실행합니다.

## 환경 변수

`.env.local` 파일에 아래 값을 채워 넣습니다. 실제 값은 Supabase 대시보드 → Project Settings → API 에서 확인할 수 있습니다.

| 변수 | 위치 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 + 서버 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 + 서버 | 익명(공개) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | 관리자 권한 키. (이번 스펙 범위 코드는 사용하지 않지만, 향후 서버 관리 작업 대비 준비) |

`NEXT_PUBLIC_` 접두사가 붙은 변수만 브라우저에서 읽을 수 있습니다. 접두사가 없는 값은 서버 코드에서만 사용됩니다.

`.env.example`은 위 목록을 자리표시자와 함께 커밋해 두고, `.env.local`은 `.gitignore`로 제외합니다.

## 로컬에서 실행하기

**0. Supabase 준비 (최초 1회)**

1. https://supabase.com 대시보드에서 새 프로젝트 생성.
2. **SQL Editor → New query**에 [`supabase/schema.sql`](supabase/schema.sql) 파일 전체를 붙여넣고 **Run**. (재실행 안전, RLS 정책까지 포함)
3. **Authentication → Providers → Email**에서 "Confirm email"을 **OFF**로, Password min length를 **8**로 설정.

**1. 로컬 실행**

```bash
# 의존성 설치
npm install

# 환경 변수 준비
cp .env.example .env.local        # .env.local의 값을 실제 값으로 수정

# 개발 서버
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

자주 쓰는 npm 스크립트:

| 명령 | 하는 일 |
|------|---------|
| `npm run dev` | 로컬 개발 서버 (핫 리로드) |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm run start` | 빌드된 결과를 로컬에서 실행 |
| `npm run lint` | ESLint 검사 |

## Vercel에 배포하기

1. **Supabase 프로젝트 준비**: 위 "로컬에서 실행하기 > 0. Supabase 준비" 절차를 완료합니다.
2. **GitHub에 푸시**: 이 저장소를 GitHub에 올립니다.
3. **Vercel에서 Import**: vercel.com → New Project → 이 저장소 선택 → Framework preset은 Next.js가 자동 감지됩니다.
4. **환경 변수 등록**: Vercel 프로젝트 Settings → Environment Variables에서 `.env.example`의 세 변수를 모두 추가합니다. Production, Preview, Development 세 환경 모두 설정합니다.
5. **Deploy 클릭**. 이후에는 default 브랜치에 푸시할 때마다 자동 배포됩니다.

주의:
- 커스텀 서버(`server.js`)를 두지 않습니다. Next.js 기본 구조만 사용해야 Vercel이 정상 배포합니다.
- 런타임에 로컬 파일 시스템에 쓰지 않습니다. 파일 저장이 필요하면 Supabase Storage를 사용합니다.
- 백그라운드 작업이 필요하면 앱 안에서 돌리지 말고 Supabase의 Scheduled Functions 또는 별도 서비스를 사용합니다.

## 인증 방식에 대한 짧은 노트

이 앱은 사용자에게는 "아이디"만 보이지만, 내부적으로는 Supabase Auth의 email/password를 그대로 씁니다. 아이디는 소문자로 정규화된 뒤 `{username}@my-interview.local` 형태의 합성 이메일로 저장됩니다. 사용자 화면에 이메일이 노출되는 지점은 없습니다. 자세한 근거는 [specs/001-question-viewer/research.md](specs/001-question-viewer/research.md) R1을 참고하세요.

## Spec Kit 워크플로

이 저장소는 Spec Kit으로 관리됩니다. 새 기능은 다음 순서로 진행합니다:

1. `/speckit-specify` — 기능 명세 작성
2. `/speckit-clarify` — 모호한 부분 정리 (선택)
3. `/speckit-plan` — 구현 계획 수립 (Constitution 검사 통과 필수)
4. `/speckit-tasks` — 작업 목록 생성
5. `/speckit-implement` — 구현 실행

현재 스펙: [specs/001-question-viewer/spec.md](specs/001-question-viewer/spec.md)
프로젝트 규칙: [.specify/memory/constitution.md](.specify/memory/constitution.md)
