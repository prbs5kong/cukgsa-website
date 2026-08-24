# CU Boulder KGSA 홈페이지

콜로라도 대학교 볼더 캠퍼스 한인 대학원 학생회(Korean Graduate Student Association, KGSA) 웹사이트입니다.
CU Boulder 공식 브랜드 컬러를 사용한 대학 기관형 디자인입니다.
상단은 **골드 마스트헤드 + 캠퍼스 배너 + 검정 내비게이션**, 본문은 **흰 바탕**입니다.

빌드 도구·프레임워크 없이 **순수 HTML + CSS + JavaScript**로 만들어져,
`index.html`을 더블클릭하면 바로 열립니다.

> 🧑‍💻 **개발을 모르는 운영진이라면 [운영가이드.md](운영가이드.md) 를 보세요.**
> 배포 방법, 행사·후원업체·게시글 추가 방법, 고장났을 때 대처법이 정리돼 있습니다.
> 이 README는 코드 구조 위주입니다.

---

## 1. 폴더 구조

```
Website/
├── index.html              메인 페이지
├── pages/
│   ├── about.html          KGSA 소개 · 임원진 · 회칙
│   ├── board.html          통합 게시판 (탭 + 검색 + 페이지네이션)
│   ├── info.html           볼더 생활정보
│   ├── sponsors.html       후원업체 · 제휴 안내
│   ├── links.html          유용한 링크 모음
│   ├── join.html           회원 가입
│   ├── contact.html        문의 · 공항 픽업 · FAQ
│   ├── write.html          글쓰기 · 수정
│   ├── post.html           글 상세 · 댓글
│   └── admin.html          운영진 전용
├── assets/
│   ├── css/style.css       전체 디자인 시스템 (흰 바탕 기준)
│   ├── js/data.js          ★ 콘텐츠 데이터 — 여기만 고치면 됩니다
│   ├── js/main.js          헤더/푸터 생성, 게시판 로직, 인터랙션
│   ├── js/supabase-config.js ★ Supabase 접속 정보 (여기 두 줄만 채우면 게시판 ON)
│   ├── js/kgsa-api.js      로그인·글·댓글·신고·차단 API
│   ├── js/page-board.js    게시판 목록 (DB 연동)
│   ├── js/page-post.js     글 상세 + 댓글
│   ├── js/page-write.js    글쓰기 + 사진 업로드
│   ├── js/page-admin.js    운영진 화면 (신고·차단·행사·후원·임원·연락처)
│   └── js/page-setup.js    연결 상태 점검
│   └── img/
│       ├── cu-campus.jpg   상단 배너 (플랫아이언 + 캠퍼스)
│       └── cu-aerial.jpg   예비 이미지 (볼더 항공 사진)
├── supabase/
│   ├── schema.sql          DB 스키마 + 권한 정책 (RLS)
│   └── 설치방법.md          ★ 게시판 백엔드 설치 절차
├── set-domain.sh           도메인 일괄 설정 스크립트
├── launch-check.sh         출시 전 예시 데이터 점검
├── sitemap.xml             검색엔진용 페이지 목록
├── robots.txt
├── 404.html                없는 주소로 들어왔을 때
├── UMKGSA_KEEP-reference.png    참고용 스크린샷
├── 운영가이드.md            ★ 비개발자 운영진용 문서
└── README.md
```

---

## 2. 로컬에서 실행하기

**방법 A — 그냥 열기**
`index.html` 더블클릭. (별도 설치 불필요)

**방법 B — 로컬 서버 (권장, 맥 기본 파이썬 사용)**

```bash
cd /Users/wooh2237/Documents/homepage
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 접속.

---

## 3. 내용 수정하는 법

### 게시글 · 행사 · 후원업체 · 임원진
전부 **`assets/js/data.js` 한 파일**에서 관리합니다. 형식만 맞추면 됩니다.

```js
{ id: 100, cat: "notice", title: "제목", date: "2026-09-01",
  author: "운영진", badge: "pin", link: "#" },
```

- `cat` — `notice` / `career` / `market` / `housing` / `community`
- `badge` — `"pin"`(고정 공지) / `"new"` / `"hot"` / `null`
- `link` — 상세 글 URL. 없으면 `"#"`

### 메뉴 구조
`assets/js/main.js` 맨 위의 `NAV` 배열을 수정하세요.

### 색상 · 폰트
`assets/css/style.css` 맨 위 `:root` 블록의 CSS 변수만 바꾸면 전체에 반영됩니다.

### 로고
현재는 `KGSA` 워드마크(글자)를 사용합니다.
이미지 로고가 있으면 `assets/img/logo.png`에 넣고, `main.js`의
`<span class="brand-name">KGSA</span>` 부분을
`<img src="${url('assets/img/logo.png')}" alt="KGSA" style="height:38px">`로 교체하세요.
(헤더와 푸터 두 곳에 있습니다.)

---

## 4. 지금 꼭 교체해야 할 자리 (예시 데이터임)

| 위치 | 내용 |
|---|---|
| `data.js` → `KGSA_OFFICERS` | 실제 임원진 이름 · 직책 · 학과 |
| `data.js` → `KGSA_SPONSORS` | 실제 후원업체 |
| `data.js` → `KGSA_POSTS` | 실제 공지·게시글 |
| `main.js` → 푸터/헤더 | `kgsa@colorado.edu` → 실제 대표 이메일 |
| `main.js` → `renderFooter` | 인스타·페이스북·카카오 오픈채팅 링크 (`href="#"`) |
| `about.html` | 회칙 전문, 연혁, 회원 수 통계 |
| `contact.html` | 인스타 계정, 카카오 오픈채팅 링크 |
| `info.html` | 렌트 시세, 전화번호 등 최신 정보 확인 |

---

## 5. 폼 연결 (가입 · 문의)

지금은 **데모 모드**라 제출해도 서버로 전송되지 않습니다.
아래 둘 중 하나로 5분 안에 연결할 수 있습니다.

**A. Formspree (가장 쉬움, 무료 월 50건)**
1. https://formspree.io 가입 → 폼 생성 → 엔드포인트 주소 복사
2. `join.html` / `contact.html`의 `<form>` 태그를 아래처럼 수정하고,
   페이지 하단의 데모용 `<script>` 블록을 삭제

```html
<form class="form-grid" action="https://formspree.io/f/여기에본인코드" method="POST">
```

**B. Google Forms**
구글 폼을 만든 뒤, 폼의 "보내기 → `<>`" 에서 iframe 코드를 복사해
`join.html`의 `<div class="panel">` 내부와 교체.

---

## 6. 인터넷에 올리기 (배포)

**Netlify Drop — 가장 쉬움 (계정 없이도 가능)**
1. https://app.netlify.com/drop 접속
2. `homepage` 폴더를 통째로 드래그 앤 드롭
3. 끝. `xxx.netlify.app` 주소가 바로 생성됩니다.

**GitHub Pages — 무료, 도메인 연결 가능**
```bash
cd /Users/wooh2237/Documents/homepage
git init && git add . && git commit -m "Initial KGSA website"
gh repo create cu-kgsa --public --source=. --push
```
GitHub 저장소 → Settings → Pages → Branch `main` / 폴더 `/ (root)` 선택.

도메인(예: `cukgsa.org`)을 구입했다면 Netlify/GitHub Pages 양쪽 모두
DNS 설정에서 연결할 수 있고, HTTPS는 자동 적용됩니다.

---

## 7. 게시판 백엔드 (Supabase)

구글 로그인 · 글쓰기 · 사진 · 댓글 · 신고 · 계정 차단 코드가 모두 들어 있습니다.
`assets/js/supabase-config.js` 두 줄만 채우면 켜집니다.

설치 절차: **[supabase/설치방법.md](supabase/설치방법.md)**

**운영진이 웹에서 직접 고치는 것** (재배포 불필요) — 행사, 후원업체, 임원진,
연락처·SNS, 신고 처리, 계정 차단, 공지 고정. 모두 DB(`events` / `sponsors` /
`officers` / `site_settings` 테이블)에 저장되며 `pages/admin.html` 에서 편집합니다.
백엔드 미연결 시에는 `data.js` 의 값이 그대로 쓰입니다.

**보안 요약** — 브라우저에 노출되는 anon key 만으로는 아무것도 할 수 없습니다.
모든 권한은 `supabase/schema.sql` 의 RLS 정책과 칼럼 GRANT 로 DB에서 강제됩니다.

- 회원은 `profiles.role` / `banned_until` 을 **칼럼 권한 자체가 없어** 수정 불가
  (스스로 관리자 승격 · 차단 해제 불가)
- 운영진이 숨긴 글은 `hidden_by_admin` 칼럼으로 관리 — 작성자가 되살릴 수 없음
- 신고 내용은 운영진만 조회 가능 (신고자 보호)
- 회원 글은 화면에 넣기 전 전부 escape — XSS 차단 (`kgsa-api.js` 의 `esc()`)

---

## 8. 디자인 규칙

미시간대(UMKGSA_KEEP.com)·UT Austin 한인 학생회처럼 **정보를 읽기 쉬운 기관형 레이아웃**입니다.

### 상단 구조 (`main.js` → `renderHeader`)
```
검정 유틸바   (.utilbar)      연락처 · 회원가입 · 문의
골드 마스트헤드 (.masthead)   산 로고 + KGSA + 국문명 한 줄
캠퍼스 배너   (.bannerstrip)  홈 148px / 하위 페이지 86px
검정 내비게이션 (.site-header) 스크롤 시 상단 고정
   └ 전체메뉴 (.allmenu)      모든 메뉴를 한 번에 펼쳐 보는 패널
```

내비게이션의 드롭다운과 전체메뉴 패널은 **검정 바탕 + 밝은 글씨**입니다.

### 로고
`main.js`의 `BRAND_MARK` 상수 — 플랫아이언 봉우리 3개를 그린 인라인 SVG입니다.
`fill="currentColor"`를 쓰므로 배경에 따라 색이 바뀝니다.
(골드 마스트헤드·푸터에서는 검정, 고정된 검정 내비에서는 골드)

### 배너 이미지 교체
`assets/img/cu-campus.jpg`를 같은 이름으로 바꿔 넣으면 됩니다.
가로로 긴 사진(1200px 이상)이 좋고, 보이는 세로 위치는
`style.css`의 `.bannerstrip img { object-position: center 24%; }`에서 조절합니다.
(값을 키우면 사진의 아래쪽이 보입니다.)

### 지킬 것
- **본문 배경은 흰색**입니다. 어두운 블록은 상단 내비·드롭다운·푸터 하단 띠에만 씁니다.
- 게시판 카드 머리띠는 3단계입니다 — 흰 본문 < `--card-head`(일반 게시판)
  < `--card-head-lead`(벼룩시장). 새 게시판을 추가하면 `--card-head`를 쓰세요.
- 골드는 마스트헤드·강조선·기본 버튼에 씁니다. 본문을 골드로 넓게 칠하지 않습니다.
- 버튼은 `.btn--primary`(골드) / `.btn--outline`(테두리) 두 가지.
  호버 시 색만 바뀌고 **움직이지 않습니다**.
- 그라디언트, 글로우, 큰 그림자, 스크롤 등장 애니메이션은 쓰지 않습니다.
- 이모지 아이콘 대신 텍스트 레이블을 씁니다.
- 모서리 반경은 `--radius`(3px)로 통일합니다.
- 홈의 게시판 순서는 `index.html`에서, 게시판 페이지 탭 순서는
  `data.js`의 `KGSA_CATEGORIES` 배열 순서에서 정해집니다. (현재 벼룩시장이 맨 앞)
- 벼룩시장은 ① 상단 메뉴 최상위 항목 ② 게시판 드롭다운 안 ③ 홈 상단 전체 폭 카드
  — 세 곳에서 진입할 수 있습니다. 실제 데이터는 게시판(`cat=market`) 하나입니다.

## 9. 접근성 · 반응형

- 모바일 / 태블릿 / 데스크톱 대응 (햄버거 메뉴 포함)
- 키보드 탐색, 스킵 링크, ARIA 라벨 적용
- `prefers-reduced-motion` 존중 (애니메이션 최소화 설정 대응)
- 다크 모드는 사용하지 않습니다. (흰 바탕 단일 테마)

---

## 10. 참고

- 디자인은 CU Boulder 브랜드 가이드(colorado.edu/brand)의 색상 체계를 따랐습니다.
- 본 사이트는 학생 단체 사이트이며 대학교 공식 웹사이트가 아닙니다.
  대학 로고·워드마크를 사용하려면 학교의 사용 승인이 필요합니다.
