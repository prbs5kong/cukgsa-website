/* ==========================================================================
   CU Boulder KGSA — 사이트 콘텐츠 데이터
   ⚠️ 여기만 수정하면 홈/게시판 페이지 내용이 전부 바뀝니다.
   (지금 값은 예시 데이터입니다. 실제 내용으로 교체하세요.)
   ========================================================================== */

/* 게시판 카테고리 정의 --------------------------------------------------- */
const KGSA_CATEGORIES = [
  { id: "notice",    name: "공지사항",   en: "Announcements" },
  { id: "market",    name: "벼룩시장",   en: "Marketplace" },
  { id: "career",    name: "취업·인턴",  en: "Careers" },
  { id: "community", name: "자유게시판", en: "Community" },
  { id: "housing",   name: "하우징",     en: "Housing" },
];

/* 게시글 --------------------------------------------------------------------
   date  : "YYYY-MM-DD"
   badge : "pin" | "new" | "hot" | null
   link  : 상세 페이지 / 외부 링크 URL (없으면 "#")
--------------------------------------------------------------------------- */
/* ▸ 새 글은 아래 한 줄을 복사해서 붙여넣으세요. id 는 겹치지 않는 아무 숫자.
     { id: 100, cat: "notice", title: "글 제목", date: "2026-09-01", author: "운영진", badge: "new", link: "#" },
   ▸ link 에 주소를 넣으면 제목 클릭 시 그 주소로 이동합니다. (구글 문서, 공고 링크 등)
--------------------------------------------------------------------------- */
const KGSA_POSTS = [
  // ── 공지사항 ────────────────────────────────────────────────
  { id: 1,  cat: "notice", title: "2026-27 KGSA 학생회 임원 모집 안내", date: "2026-08-14", author: "운영진", badge: "pin",  link: "#" },
  { id: 2,  cat: "notice", title: "[필독] 2026 신입생 공항 픽업 신청 (DIA ↔ Boulder)", date: "2026-08-10", author: "운영진", badge: "pin",  link: "#" },
  { id: 4,  cat: "notice", title: "KGSA 신규 홈페이지 오픈 및 회원 가입 안내", date: "2026-08-05", author: "운영진", badge: "new", link: "#" },
  { id: 5,  cat: "notice", title: "한국연구재단 해외 박사학위 신고 제도 안내", date: "2026-07-22", author: "운영진", badge: null,  link: "#" },
  { id: 6,  cat: "notice", title: "재외국민 등록 및 여권 갱신 (덴버 총영사관 순회영사)", date: "2026-07-11", author: "운영진", badge: null,  link: "#" },

  // ── 취업·인턴 ───────────────────────────────────────────────
  //   body 에 설명을 쓰고 링크를 문단 안에 넣으면, 글을 열었을 때 본문으로 보입니다.
  { id: 10, cat: "career", title: "[ISSS] CPT · OPT 신청 절차 — 국제학생 필독", date: "2026-08-16", author: "운영진", badge: "pin", link: "#",
    body: `F-1 비자로 미국에서 인턴이나 취업을 하려면 반드시 사전에 근로 허가를 받아야 합니다. 허가 없이 일하면 신분에 문제가 생길 수 있으니 꼭 먼저 확인하세요.

■ CPT (재학 중 인턴)
전공과 직접 관련된 인턴십·실습에 대해 학기 중 또는 방학 중 받는 허가입니다. 학과 승인과 ISSS 승인이 모두 필요하고, 승인 전에 일을 시작하면 안 됩니다.

■ OPT (졸업 후 취업)
졸업 후 최대 12개월(STEM 전공은 추가 24개월) 일할 수 있는 허가입니다. 신청부터 승인까지 수 개월이 걸리므로 졸업 예정일을 기준으로 역산해서 미리 준비하세요.

■ 중요
CPT·OPT는 고용주의 스폰서십이 필요 없습니다. H-1B와 다릅니다. 자세한 절차와 서류는 아래 ISSS 공식 안내를 확인하세요.

https://www.colorado.edu/isss/students/current-students/f-1-student-overview/curricular-practical-training-cpt` },

  { id: 11, cat: "career", title: "[CU Career Services] 국제학생 취업 가이드 · H-1B 스폰서 기업 검색", date: "2026-08-15", author: "운영진", badge: "pin", link: "#",
    body: `CU Career Services에서 국제학생을 위한 취업 자료를 제공합니다. 학교 계정으로 무료 이용할 수 있으니 적극 활용하세요.

■ Handshake
교내외 채용 공고 플랫폼입니다. CPT·OPT 학생을 받는 기업, 국제학생 스폰서십을 제공하는 기업으로 필터링할 수 있습니다.

■ GoinGlobal
H-1B 비자를 신청한 이력이 있는 기업 약 50만 건의 기록을 업종·직무·지역별로 검색할 수 있습니다. 스폰서십을 해주는 회사를 미리 추려서 지원 전략을 세울 때 유용합니다.

■ 이력서·인터뷰 첨삭
Career Services에서 1:1 상담을 예약할 수 있습니다.

https://www.colorado.edu/career/international-students/international-student-job-search` },

  { id: 12, cat: "career", title: "[CU Boulder] 교내 채용 · 연구직 공고 (LASP 포함)", date: "2026-08-14", author: "운영진", badge: "hot", link: "#",
    body: `학교 공식 채용 사이트입니다. 상시로 새 공고가 올라옵니다.

교내 근로(on-campus employment)는 F-1 학생이 별도 허가 없이 주 20시간까지 일할 수 있어서, 국제학생에게 가장 접근성이 좋습니다.

■ 눈여겨볼 곳
LASP(Laboratory for Atmospheric and Space Physics)는 CU 볼더의 우주과학 연구소로, 700명 이상이 근무하며 학생 연구원도 상시 채용합니다. 그 외 각 학과의 연구조교(RA)·강의조교(TA), 도서관, 렉센터 등에도 자리가 있습니다.

■ 검색 요령
Job Category에서 Student Employment 또는 Research Faculty를 선택하면 대학원생 대상 공고를 빠르게 찾을 수 있습니다.

https://jobs.colorado.edu/` },

  { id: 13, cat: "career", title: "[NCAR · UCAR] 포스닥 · SOARS 인턴십 · Next Generation Fellowship", date: "2026-08-12", author: "운영진", badge: "new", link: "#",
    body: `볼더에 본부를 둔 국립대기연구센터(NCAR)와 운영기관 UCAR의 기회 모음입니다. 대기과학뿐 아니라 전산·공학·우주물리 분야도 뽑습니다.

■ ASP Postdoctoral Fellowship
대기·지구 시스템 과학 분야 박사후연구원 과정입니다. 매년 공모하며 경쟁이 치열합니다.

■ SOARS 인턴십
학부·대학원생 대상 여름 연구 인턴십으로, 멘토링 프로그램이 함께 제공됩니다.

■ Next Generation Fellowships
신진 연구자 대상 펠로우십입니다.

캠퍼스에서 차로 가까워 통근이 어렵지 않다는 것도 장점입니다. 공고별로 시민권·비자 요건이 다르니 각 공고의 eligibility를 꼭 확인하세요.

https://ncar.ucar.edu/opportunities` },

  { id: 14, cat: "career", title: "[NREL] 대학원생 인턴 · 연구직 (Golden, CO)", date: "2026-08-10", author: "운영진", badge: null, link: "#",
    body: `미국 에너지부 산하 국립재생에너지연구소(NREL)입니다. 볼더에서 차로 약 40분 거리인 Golden에 있습니다.

신재생에너지, 전력계통, 수소, 바이오연료, 재료과학, 데이터과학 등 폭넓은 분야에서 대학원생 인턴과 연구직을 뽑습니다.

■ 대학원생 인턴
정규 학위과정에 재학 중이어야 하며, 학점 3.0 이상을 요구합니다. 여름 인턴이 가장 규모가 크고 보통 겨울~봄에 모집합니다.

■ 확인할 점
국립연구소 특성상 공고에 따라 시민권 또는 특정 신분을 요구하는 경우가 있습니다. 지원 전에 각 공고의 요건을 반드시 확인하세요.

https://www.nrel.gov/careers/` },

  { id: 15, cat: "career", title: "[NIST Boulder] NRC 박사후연구원 — 매년 2/1 · 8/1 마감", date: "2026-08-08", author: "운영진", badge: null, link: "#",
    body: `⚠️ 먼저 확인하세요: 이 프로그램은 미국 시민권자만 지원할 수 있습니다. 국제학생은 대상이 아닙니다.

미국 표준기술연구소(NIST) 볼더 캠퍼스의 박사후연구원 과정입니다. 미국 연구평의회(NRC)가 심사를 맡습니다.

■ 개요
임기 2년이며, NIST 연구원과 직접 협업합니다. 물리·화학·재료·전자·정보기술 등 분야가 다양하고, 볼더 캠퍼스는 양자센서·시간주파수 분야가 특히 강합니다.

■ 일정
매년 2월 1일과 8월 1일, 연 2회 마감입니다. 동료평가 방식으로 심사하며 경쟁률이 높습니다.

■ 참고
JILA는 CU 볼더와 NIST가 함께 운영하는 연구소로, 별도 채용 절차가 있습니다.

https://www.nist.gov/programs-projects/nrc-postdoctoral-associate-program` },

  // ── 벼룩시장 ────────────────────────────────────────────────
  { id: 20, cat: "market", title: "[졸업 정리] 책상 · 의자 · 모니터 일괄 판매 (~8/30)", date: "2026-08-17", author: "김**", badge: "new", link: "#" },
  { id: 21, cat: "market", title: "스키 장비 (부츠 265 / 폴 포함) 팝니다", date: "2026-08-15", author: "이**", badge: null,  link: "#" },
  { id: 22, cat: "market", title: "무빙세일: 주방용품 · 소형가전 (2년 이하 사용)", date: "2026-08-13", author: "박**", badge: null,  link: "#" },
  { id: 23, cat: "market", title: "퀸사이즈 매트리스 + 프레임 나눔합니다", date: "2026-08-11", author: "최**", badge: null,  link: "#" },
  { id: 24, cat: "market", title: "2019 Toyota Corolla LE 판매 (68k miles)", date: "2026-08-06", author: "정**", badge: null,  link: "#" },
  { id: 25, cat: "market", title: "자전거 (Trek FX2, 헬멧·자물쇠 포함) 팝니다", date: "2026-08-05", author: "강**", badge: null,  link: "#" },
  { id: 26, cat: "market", title: "전기밥솥 · 에어프라이어 · 전자레인지 일괄", date: "2026-08-04", author: "임**", badge: null,  link: "#" },
  { id: 27, cat: "market", title: "책장 · 책상 스탠드 무료 나눔 (Martin Acres)", date: "2026-08-01", author: "서**", badge: null,  link: "#" },
  { id: 28, cat: "market", title: "겨울 옷 · 스노부츠 (여성 250) 정리합니다", date: "2026-07-30", author: "오**", badge: null,  link: "#" },

  // ── 하우징 ──────────────────────────────────────────────────
  { id: 30, cat: "housing", title: "[서블렛] Bear Creek Apartments 1BR (9/1~12/31)", date: "2026-08-16", author: "윤**", badge: "new", link: "#" },
  { id: 31, cat: "housing", title: "[룸메이트] Williams Village North 여성 룸메 구합니다", date: "2026-08-12", author: "한**", badge: null,  link: "#" },
  { id: 32, cat: "housing", title: "Boulder 렌트 계약 시 체크리스트 (경험 공유)", date: "2026-08-03", author: "운영진", badge: null,  link: "#" },
  { id: 33, cat: "housing", title: "[매물] Martin Acres 하우스 2BR — 가족 거주 추천", date: "2026-07-28", author: "조**", badge: null,  link: "#" },
  { id: 34, cat: "housing", title: "Family Housing (Athens/Newton Court) 대기 후기", date: "2026-07-19", author: "장**", badge: null,  link: "#" },

  // ── 자유게시판 ──────────────────────────────────────────────
  { id: 40, cat: "community", title: "볼더 근처 등산 코스 추천 좀 부탁드려요", date: "2026-08-17", author: "산악부", badge: "hot", link: "#" },
  { id: 41, cat: "community", title: "주말 축구 모임 인원 모집합니다 (매주 일요일)", date: "2026-08-15", author: "FC볼더", badge: null,  link: "#" },
  { id: 42, cat: "community", title: "덴버 한인마트 장보기 카풀 하실 분?", date: "2026-08-14", author: "김**", badge: null,  link: "#" },
  { id: 43, cat: "community", title: "박사 자격시험(Prelim) 준비 스터디 모집", date: "2026-08-09", author: "이**", badge: null,  link: "#" },
  { id: 44, cat: "community", title: "볼더에서 아이 키우기 — 데이케어 정보 공유", date: "2026-08-02", author: "맘카페", badge: null,  link: "#" },
  { id: 45, cat: "community", title: "미국 세금보고(1040NR) 관련 질문드립니다", date: "2026-07-25", author: "박**", badge: null,  link: "#" },
];

/* 다가오는 행사 ----------------------------------------------------------
   ▸ 추가하려면 아래 한 줄을 복사해서 목록 안에 붙여넣고 내용만 바꾸세요.
     { date: "2026-11-15", title: "행사 이름", desc: "한 줄 설명", where: "장소", time: "오후 6:00" },
   ▸ date 는 반드시 "YYYY-MM-DD" 형식. 날짜순 정렬은 자동이 아니니 원하는 순서대로 두세요.
   ▸ 끝난 행사는 줄을 지우면 홈에서 사라집니다.
   ▸ 줄 끝 쉼표( , )를 빠뜨리지 마세요. 가장 흔한 실수입니다.
------------------------------------------------------------------------- */
const KGSA_EVENTS = [
  { date: "2026-08-28", title: "2026 정기 총회 (Annual Meeting)",
    desc: "회칙에 따른 연 1회 정기 총회입니다. 임원 선출과 한 해 활동 계획을 함께 정합니다. 회원 누구나 참석·투표할 수 있습니다.",
    where: "장소 추후 공지", time: "" },
  // ▲ 장소·시간이 정해지면 위 where / time 을 채워 주세요.
];

/* 후원업체 ---------------------------------------------------------------
   ▸ 추가하려면 아래 한 줄을 복사해서 붙여넣으세요.
     { name: "업체 이름", cat: "업종 한 줄", initials: "AB", url: "https://업체주소.com" },
   ▸ initials 는 로고 자리에 표시될 영문 2글자입니다. (예: Boulder Dental → "BD")
   ▸ 홈페이지가 없는 업체는 url 을 "#" 으로 두세요.
------------------------------------------------------------------------- */
const KGSA_SPONSORS = [
  // ⚠️ 아래는 예시입니다. 실제 후원 계약을 맺은 업체로 교체하세요.
  //    logo 에 이미지 주소를 넣으면 글자 대신 로고가 표시됩니다.
  { name: "볼더 한인마트",     cat: "한국 식료품 · 반찬",      phone: "303-000-0000", area: "Boulder, CO",  logo: "", url: "#" },
  { name: "덴버 한인치과",     cat: "치과 · 한국어 진료",      phone: "303-000-0001", area: "Aurora, CO",   logo: "", url: "#" },
  { name: "로키산 한의원",     cat: "한방 진료 · 침구",        phone: "303-000-0002", area: "Denver, CO",   logo: "", url: "#" },
  { name: "콜로라도 세무회계", cat: "유학생 세금보고 · 기장",  phone: "303-000-0003", area: "Denver, CO",   logo: "", url: "#" },
  { name: "플랫아이언 자동차", cat: "정비 · 중고차 매매",      phone: "303-000-0004", area: "Louisville, CO", logo: "", url: "#" },
  { name: "볼더 한식당",       cat: "한식 · 도시락 · 케이터링", phone: "303-000-0005", area: "Boulder, CO",  logo: "", url: "#" },
];

/* 학생회 임원 ------------------------------------------------------------
   ▸ { name: "이름", role: "직책", dept: "학과, 학위" },
   ▸ 아바타 동그라미에는 이름의 첫 글자가 자동으로 들어갑니다.
------------------------------------------------------------------------- */
const KGSA_OFFICERS = [
  { name: "류승걸", role: "President",      dept: "Aerospace Engineering and Sciences" },
  { name: "오원석", role: "Vice-President", dept: "Electrical and Computer Engineering" },
  // 나머지 임원은 2026-08-28 회의에서 직책 확정 예정.
  // 정해지면 아래 형식으로 한 줄씩 추가하세요.
  //   { name: "이름", role: "직책", dept: "학과" },
];

/* --- 전역 노출 (main.js에서 사용) — 수정하지 마세요 -------------------- */
Object.assign(window, {
  KGSA_CATEGORIES, KGSA_POSTS, KGSA_EVENTS, KGSA_SPONSORS, KGSA_OFFICERS,
});
