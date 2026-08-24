/* ==========================================================================
   CU Boulder KGSA — 공통 스크립트
   헤더/푸터 생성, 모바일 메뉴, 게시글 렌더링, 게시판 필터
   ========================================================================== */

/* --- 네비게이션 구조 (메뉴 수정은 여기서) -------------------------------- */
const NAV = [
  {
    label: "KGSA", href: "pages/about.html",
    children: [
      { label: "학생회 소개", href: "pages/about.html" },
      { label: "임원진", href: "pages/about.html#officers" },
      { label: "회칙 · 연혁", href: "pages/about.html#bylaws" },
      { label: "가입 안내", href: "pages/join.html" },
    ],
  },
  {
    label: "게시판", href: "pages/board.html",
    children: [
      { label: "공지사항", href: "pages/board.html?cat=notice" },
      { label: "벼룩시장", href: "pages/board.html?cat=market" },
      { label: "취업 · 인턴", href: "pages/board.html?cat=career" },
      { label: "자유게시판", href: "pages/board.html?cat=community" },
      { label: "하우징", href: "pages/board.html?cat=housing" },
      { label: "글쓰기", href: "pages/write.html" },
    ],
  },
  { label: "벼룩시장", href: "pages/board.html?cat=market" },
  {
    label: "생활정보", href: "pages/info.html",
    children: [
      { label: "신입생 가이드", href: "pages/info.html#newcomer" },
      { label: "주거 · 하우징", href: "pages/info.html#housing" },
      { label: "교통 · 자동차", href: "pages/info.html#transport" },
      { label: "의료 · 보험", href: "pages/info.html#health" },
      { label: "쇼핑 · 먹거리", href: "pages/info.html#food" },
      { label: "레저 · 여행", href: "pages/info.html#leisure" },
    ],
  },
  { label: "후원업체", href: "pages/sponsors.html" },
  { label: "링크", href: "pages/links.html" },
  { label: "문의", href: "pages/contact.html" },
];

/* --- 경로 보정 (pages/ 안에서는 ../ 접두) -------------------------------- */
const ROOT = document.documentElement.dataset.root || "";
const url = (href) => (href.startsWith("http") || href.startsWith("#") ? href : ROOT + href);

/* 실제 KGSA 로고 (마운틴 + CU 방패 뱃지). 페이지 깊이에 따라 경로가 달라지므로
   url() 로 매번 계산해서 씁니다. */
const brandLogo = () =>
  `<img class="brand-mark" src="${url("assets/img/logo.png")}" alt="KGSA" width="44" height="44">`;

const CARET = `<svg class="caret" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4.5 6 8.5 10 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* --- 헤더 --------------------------------------------------------------- */
function renderHeader() {
  const here = document.body.dataset.page || "";
  const mount = document.getElementById("site-header");
  if (!mount) return;

  const navItems = NAV.map((item) => {
    const active = item.href.includes(here) && here ? " is-active" : "";
    if (!item.children) {
      return `<li><a class="nav-link${active}" href="${url(item.href)}">${item.label}</a></li>`;
    }
    const subs = item.children
      .map((c) => `<li><a href="${url(c.href)}">${c.label}</a></li>`)
      .join("");
    return `<li>
        <a class="nav-link${active}" href="${url(item.href)}">${item.label}${CARET}</a>
        <ul class="dropdown">${subs}</ul>
      </li>`;
  }).join("");

  // 미시간 KGSA 방식: 모든 메뉴를 한 번에 펼쳐 보는 전체메뉴 패널
  const withKids = NAV.filter((i) => i.children);
  const flatKids = NAV.filter((i) => !i.children);
  const allmenuCols = withKids.map((item) => `
      <section class="allmenu__col">
        <h3><a href="${url(item.href)}">${item.label}</a></h3>
        <ul>${item.children.map((c) => `<li><a href="${url(c.href)}">${c.label}</a></li>`).join("")}</ul>
      </section>`).join("") + (flatKids.length ? `
      <section class="allmenu__col">
        <h3>바로가기</h3>
        <ul>${flatKids.map((c) => `<li><a href="${url(c.href)}">${c.label}</a></li>`).join("")}
          <li><a href="${url("pages/join.html")}">회원가입</a></li>
        </ul>
      </section>` : "");

  const mobileItems = NAV.map((item) => {
    if (!item.children) return `<a class="flat" href="${url(item.href)}">${item.label}</a>`;
    const subs = item.children.map((c) => `<a href="${url(c.href)}">${c.label}</a>`).join("");
    return `<details><summary>${item.label}</summary><div class="sub">${subs}</div></details>`;
  }).join("");

  mount.innerHTML = `
  <div class="utilbar">
    <div class="wrap">
      <span class="utilbar__org">University of Colorado Boulder · Korean Graduate Student&nbsp;Association</span>
      <div class="utilbar__links">
        <a class="desktop-only" href="mailto:kgsa@colorado.edu">kgsa@colorado.edu</a>
        <a href="${url("pages/contact.html")}">문의</a>
        <span id="auth-slot" class="auth-slot"></span>
      </div>
    </div>
  </div>

  <div class="masthead">
    <div class="wrap">
      <a class="brand" href="${url("index.html")}" aria-label="CU Boulder KGSA 홈">
        ${brandLogo()}
        <span class="brand-name">KGSA</span>
        <span class="brand-tag">콜로라도 볼더 한인 대학원 학생회</span>
      </a>
      <span class="masthead__en">Korean Graduate Student Association</span>
    </div>
  </div>

  <div class="bannerstrip">
    <img src="${url("assets/img/cu-campus.jpg")}" alt="" aria-hidden="true">
  </div>

  <header class="site-header">
    <div class="wrap">
      <button class="allmenu-toggle" id="allmenu-toggle" aria-expanded="false" aria-controls="allmenu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        <span>전체메뉴</span>
      </button>
      <a class="brand brand--mini" href="${url("index.html")}" aria-label="CU Boulder KGSA 홈">
        ${brandLogo()}<span class="brand-name">KGSA</span>
      </a>
      <nav aria-label="주 메뉴"><ul class="nav">${navItems}</ul></nav>
      <div class="header-actions">
<span id="auth-action" class="desktop-only"></span>
        <button class="icon-btn nav-toggle" id="nav-toggle" aria-label="메뉴 열기" aria-expanded="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </div>

    <div class="allmenu" id="allmenu" hidden>
      <div class="wrap allmenu__grid">${allmenuCols}</div>
    </div>
  </header>

  <div class="mobile-nav" id="mobile-nav">
    <div class="mobile-nav__top">
      <span class="brand">${brandLogo()}<span class="brand-name">KGSA</span></span>
      <button class="mobile-nav__close" id="nav-close" aria-label="메뉴 닫기">✕</button>
    </div>
    <div class="mobile-nav__body">
      ${mobileItems}
      <div class="mobile-cta" id="auth-mobile"></div>
    </div>
  </div>`;
}

/* --- 푸터 --------------------------------------------------------------- */
function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const year = new Date().getFullYear();

  mount.innerHTML = `
  <footer class="site-footer">
    <div class="footer-main"><div class="wrap">
      <div class="footer-grid">
        <div class="footer-col footer-brand">
          <a class="brand" href="${url("index.html")}">
            ${brandLogo()}
            <span class="brand-name">KGSA</span>
            <span class="brand-tag">콜로라도 볼더 한인 대학원 학생회</span>
          </a>
          <p>Korean Graduate Student Association at CU Boulder ·
             콜로라도 대학교 볼더 공식 등록 학생단체(RSO)입니다.
             회원 간 친목과 한국 문화 교류를 위해 활동합니다.</p>
          <div class="social">
            <a href="https://www.instagram.com/kgsa_cuboulder/" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
            <a href="#" aria-label="Facebook" title="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg></a>
            <a href="#" aria-label="KakaoTalk 오픈채팅" title="카카오톡 오픈채팅"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.8 4.3 6.1l-1 3.7c-.1.3.3.6.6.4l4.4-2.9c.3 0 .6.1.9.1 5.1 0 9.2-3.3 9.2-7.4S17.1 3 12 3z"/></svg></a>
            <a href="#" aria-label="Naver Cafe" title="네이버 카페"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h5.6l3.9 6.1V3H21v18h-5.6l-3.9-6.1V21H3V3z"/></svg></a>
            <a href="mailto:kgsa@colorado.edu" aria-label="Email" title="이메일"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg></a>
          </div>
        </div>

        <div class="footer-col">
          <h4>바로가기</h4>
          <ul>
            <li><a href="${url("pages/about.html")}">학생회 소개</a></li>
            <li><a href="${url("pages/board.html")}">게시판</a></li>
            <li><a href="${url("pages/info.html")}">생활정보</a></li>
            <li><a href="${url("pages/sponsors.html")}">후원업체</a></li>
            <li><a href="${url("pages/join.html")}">회원가입</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>신입생 필독</h4>
          <ul>
            <li><a href="${url("pages/info.html#newcomer")}">도착 첫 주 체크리스트</a></li>
            <li><a href="${url("pages/info.html#housing")}">집 구하기</a></li>
            <li><a href="${url("pages/info.html#transport")}">교통 · 운전면허</a></li>
            <li><a href="${url("pages/info.html#health")}">의료 · 보험</a></li>
            <li><a href="${url("pages/contact.html")}">공항 픽업 신청</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>연락처</h4>
          <ul>
            <li><a href="mailto:kgsa@colorado.edu">kgsa@colorado.edu</a></li>
            <li>UMC, 1669 Euclid Ave<br>Boulder, CO 80309</li>
            <li><a href="https://www.colorado.edu" target="_blank" rel="noopener">colorado.edu ↗</a></li>
            <li><a href="https://overseas.mofa.go.kr" target="_blank" rel="noopener">주덴버 출장소 ↗</a></li>
          </ul>
        </div>
      </div>

    </div></div>

    <div class="footer-legal">
      <div class="wrap">
        <span>© ${year} Korean Graduate Student Association · University of Colorado Boulder</span>
        <span>본 사이트는 학생 단체가 운영하며, 콜로라도 대학교의 공식 웹사이트가 아닙니다.</span>
      </div>
    </div>
  </footer>`;
}

/* --- 인터랙션 ----------------------------------------------------------- */
function initMobileNav() {
  const btn = document.getElementById("nav-toggle");
  const drawer = document.getElementById("mobile-nav");
  if (!btn || !drawer) return;

  const close = () => {
    drawer.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () => {
    const open = drawer.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  drawer.addEventListener("click", (e) => { if (e.target.tagName === "A") close(); });
  document.getElementById("nav-close")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/* 내비게이션 바가 실제로 상단에 붙었을 때만 .is-stuck 을 붙입니다.
   (모바일에서 붙은 뒤에만 작은 KGSA 로고가 나타납니다) */
function initAllMenu() {
  const btn = document.getElementById("allmenu-toggle");
  const panel = document.getElementById("allmenu");
  if (!btn || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.classList.toggle("is-open", open);
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  panel.addEventListener("click", (e) => { if (e.target.tagName === "A") setOpen(false); });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

function initStickyShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let anchor = 0;
  const measure = () => {
    header.classList.remove("is-stuck");
    anchor = header.getBoundingClientRect().top + window.scrollY;
    onScroll();
  };
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY >= anchor);
  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
}

/* --- 게시글 유틸 --------------------------------------------------------- */
const catName = (id) => (window.KGSA_CATEGORIES || []).find((c) => c.id === id)?.name || id;
const fmtDate = (iso) => iso.slice(5).replace("-", ".");           // 08.14
const fmtFull = (iso) => iso.replace(/-/g, ".");                   // 2026.08.14

function badgeHTML(badge) {
  if (badge === "pin") return `<span class="tag tag--pin">공지</span>`;
  if (badge === "new") return `<span class="tag tag--new">NEW</span>`;
  if (badge === "hot") return `<span class="tag tag--hot">HOT</span>`;
  return "";
}

function sortedPosts(cat) {
  const all = window.KGSA_POSTS || [];
  return all
    .filter((p) => !cat || p.cat === cat)
    .sort((a, b) => (b.badge === "pin") - (a.badge === "pin") || b.date.localeCompare(a.date));
}

/* 홈: 게시판 미리보기 카드 — 백엔드가 있으면 DB에서 */
async function renderBoardPreviewsLive() {
  const api = window.KGSA_API;
  const mounts = [...document.querySelectorAll("[data-board]")];
  if (!mounts.length) return;
  await api.init();
  const esc = window.kgsaEsc;
  const fmtD = (iso) => { const d = new Date(iso);
    return `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; };
  await Promise.all(mounts.map(async (mount) => {
    mount.innerHTML = `<li><a><span class="post-title note">불러오는 중…</span></a></li>`;
    const rows = await api.previewPosts(mount.dataset.board, Number(mount.dataset.limit || 6));
    if (rows === null) {
      mount.innerHTML = `<li><a><span class="post-title note">게시글을 불러오지 못했습니다.</span></a></li>`;
      return;
    }
    mount.innerHTML = rows.length ? rows.map((p) => `
      <li class="${p.badge === "pin" ? "is-pinned" : ""}">
        <a href="${url("pages/post.html")}?id=${p.id}">
          ${badgeHTML(p.badge)}
          <span class="post-title">${esc(p.title)}</span>
          <span class="post-date">${esc(fmtD(p.created_at))}</span>
        </a></li>`).join("")
      : `<li><a><span class="post-title note">아직 글이 없습니다.</span></a></li>`;
  }));
}

/* 홈: 게시판 미리보기 카드 (백엔드 미설정 시 예시 데이터) */
function renderBoardPreviews() {
  if (window.KGSA_API?.configured) return renderBoardPreviewsLive();
  document.querySelectorAll("[data-board]").forEach((mount) => {
    const cat = mount.dataset.board;
    const limit = Number(mount.dataset.limit || 6);
    const items = sortedPosts(cat).slice(0, limit);
    mount.innerHTML = items.map((p) => `
      <li class="${p.badge === "pin" ? "is-pinned" : ""}">
        <a href="${url("pages/post.html")}?id=${p.id}">
          ${badgeHTML(p.badge)}
          <span class="post-title">${p.title}</span>
          <span class="post-date">${fmtDate(p.date)}</span>
        </a>
      </li>`).join("");
  });
}

/* 백엔드가 설정돼 있으면 DB 내용을 우선 사용합니다.
   (운영진이 관리자 화면에서 고친 내용이 여기에 반영됩니다) */
async function contentRows(kind, fallback) {
  const api = window.KGSA_API;
  if (!api?.configured) return { rows: fallback, live: false };
  await api.init();
  const rows = await api.listContent(kind);
  return rows === null ? { rows: null, live: true } : { rows, live: true };
}

/* 홈: 행사 */
async function renderEvents() {
  const mount = document.getElementById("event-list");
  if (!mount) return;
  const MONTHS_ = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const esc = window.kgsaEsc || ((x) => x);
  const { rows, live } = await contentRows("events", window.KGSA_EVENTS || []);
  if (live) {
    if (rows === null) { mount.innerHTML = `<p class="note">행사를 불러오지 못했습니다.</p>`; return; }
    mount.innerHTML = rows.length ? rows.map((ev) => {
      const [y, mo, d] = ev.date.split("-");
      const meta = [ev.location, ev.time_text].filter(Boolean).join(" · ");
      return `<article class="event">
        <div class="event__date"><span class="m">${MONTHS_[+mo - 1]}</span><span class="d">${+d}</span></div>
        <div class="event__body"><h3>${esc(ev.title)}</h3>${ev.descr ? `<p>${esc(ev.descr)}</p>` : ""}</div>
        ${meta ? `<div class="event__meta">${esc(meta)}</div>` : ""}
      </article>`;
    }).join("") : `<p class="note">예정된 행사가 없습니다.</p>`;
    return;
  }
  if (!window.KGSA_EVENTS) return;
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  mount.innerHTML = KGSA_EVENTS.map((ev) => {
    const [, m, d] = ev.date.split("-");
    return `<article class="event">
      <div class="event__date"><span class="m">${MONTHS[+m - 1]}</span><span class="d">${+d}</span></div>
      <div class="event__body"><h3>${ev.title}</h3><p>${ev.desc}</p></div>
      <div class="event__meta">${[ev.where, ev.time].filter(Boolean).join(" · ")}</div>
    </article>`;
  }).join("");
}

/* 홈/후원 페이지: 후원업체 */
async function renderSponsors() {
  const mount = document.getElementById("sponsor-grid");
  if (!mount) return;
  const esc = window.kgsaEsc || ((x) => x);
  const safe = window.kgsaSafeUrl || ((u) => u);

  const card = (v) => {
    const href = safe(v.url);
    const ext = href !== "#" ? ' target="_blank" rel="noopener"' : "";
    const logo = v.logo || v.logo_url;
    const meta = [v.phone, v.area].filter(Boolean).join(" · ");
    return `<a class="sponsor" href="${esc(href)}"${ext}>
      ${logo ? `<span class="sponsor__logo"><img src="${esc(logo)}" alt="${esc(v.name)}" loading="lazy"></span>` : ""}
      <span class="sponsor__name">${esc(v.name)}</span>
      ${(v.cat || v.category) ? `<span class="sponsor__cat">${esc(v.cat || v.category)}</span>` : ""}
      ${meta ? `<span class="sponsor__meta">${esc(meta)}</span>` : ""}
    </a>`;
  };

  const { rows, live } = await contentRows("sponsors", window.KGSA_SPONSORS || []);
  if (live) {
    if (rows === null) { mount.innerHTML = `<p class="note">후원업체를 불러오지 못했습니다.</p>`; return; }
    mount.innerHTML = rows.length ? rows.map(card).join("")
      : `<p class="note">현재 등록된 후원업체가 없습니다.</p>`;
    return;
  }
  mount.innerHTML = (window.KGSA_SPONSORS || []).map(card).join("");
}

/* 소개 페이지: 임원진 */
async function renderOfficers() {
  const mount = document.getElementById("officer-grid");
  if (!mount) return;
  const esc = window.kgsaEsc || ((x) => x);
  const { rows, live } = await contentRows("officers", window.KGSA_OFFICERS || []);
  if (live) {
    if (rows === null) { mount.innerHTML = `<p class="note">임원진을 불러오지 못했습니다.</p>`; return; }
    mount.innerHTML = rows.map((o) => `
      <div class="person">
        <div class="avatar" aria-hidden="true">${o.photo_url
          ? `<img src="${esc(o.photo_url)}" alt="">`
          : esc(o.name.slice(0, 1))}</div>
        <h3>${esc(o.name)}</h3>
        <div class="role">${esc(o.role)}</div>
        ${o.dept ? `<div class="dept">${esc(o.dept)}</div>` : ""}
      </div>`).join("");
    return;
  }
  if (!window.KGSA_OFFICERS) return;
  mount.innerHTML = KGSA_OFFICERS.map((o) => `
    <div class="person">
      <div class="avatar" aria-hidden="true">${o.photo_url
        ? `<img src="${o.photo_url}" alt="">`
        : o.name.slice(0, 1)}</div>
      <h3>${o.name}</h3>
      <div class="role">${o.role}</div>
      ${o.dept ? `<div class="dept">${o.dept}</div>` : ""}
    </div>`).join("");
}

/* --- 게시판 페이지 ------------------------------------------------------- */
function initBoardPage() {
  const tbody = document.getElementById("post-tbody");
  if (!tbody) return;
  // 백엔드가 설정돼 있으면 page-board.js 가 DB에서 그립니다.
  if (window.KGSA_API?.configured) return;

  const PER_PAGE = 12;
  const params = new URLSearchParams(location.search);
  let state = { cat: params.get("cat") || "", q: "", page: 1 };

  const tabsMount = document.getElementById("board-tabs");
  const searchInput = document.getElementById("board-search");
  const pager = document.getElementById("board-pager");
  const countEl = document.getElementById("board-count");

  function renderTabs() {
    const cats = [{ id: "", name: "전체" }, ...(window.KGSA_CATEGORIES || [])];
    tabsMount.innerHTML = cats.map((c) =>
      `<button class="tab${state.cat === c.id ? " is-active" : ""}" data-cat="${c.id}">${c.name}</button>`
    ).join("");
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    return sortedPosts(state.cat).filter((p) => !q || p.title.toLowerCase().includes(q));
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    countEl.textContent = `총 ${list.length}건`;

    tbody.innerHTML = slice.length
      ? slice.map((p) => `
        <tr>
          <td class="c-cat"><span class="cat-chip">${catName(p.cat)}</span></td>
          <td>
            <a href="post.html?id=${p.id}" class="post-cell">
              ${badgeHTML(p.badge)}
              <span${p.badge === "pin" ? ' class="is-pinned-title"' : ""}>${p.title}</span>
            </a>
          </td>
          <td class="c-author">${p.author}</td>
          <td class="c-date">${fmtFull(p.date)}</td>
        </tr>`).join("")
      : `<tr><td colspan="4"><div class="empty-state">검색 결과가 없습니다. 다른 키워드로 검색해 보세요.</div></td></tr>`;

    pager.innerHTML =
      `<button ${state.page === 1 ? "disabled" : ""} data-page="${state.page - 1}" aria-label="이전 페이지">←</button>` +
      Array.from({ length: pages }, (_, i) =>
        `<button class="${state.page === i + 1 ? "is-active" : ""}" data-page="${i + 1}">${i + 1}</button>`
      ).join("") +
      `<button ${state.page === pages ? "disabled" : ""} data-page="${state.page + 1}" aria-label="다음 페이지">→</button>`;

    renderTabs();
  }

  tabsMount.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    state.cat = btn.dataset.cat; state.page = 1; render();
    history.replaceState(null, "", state.cat ? `?cat=${state.cat}` : location.pathname);
  });

  searchInput.addEventListener("input", (e) => { state.q = e.target.value; state.page = 1; render(); });

  pager.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    render();
    document.getElementById("board-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
}


/* --- 로그인 폼 (umksag 방식: 이메일·비밀번호 + 구글) ----------------------
   홈 오른쪽 박스와 로그인 페이지가 같은 함수를 씁니다. mode = "login" | "signup" */
function loginFormHTML(mode) {
  const j = url("pages/join.html");
  if (mode === "signup") {
    return `
      <form class="loginbox" data-mode="signup" novalidate>
        <div class="loginbox__grid loginbox__grid--signup">
          <input type="text"     name="name" placeholder="실명 (운영진 확인용, 비공개)" autocomplete="name" required>
          <input type="text"     name="nickname" placeholder="닉네임 (게시판에 공개됩니다)" minlength="2" maxlength="20" required>
          <input type="email"    name="email" placeholder="이메일" autocomplete="email" required>
          <input type="password" name="password" placeholder="비밀번호 (6자 이상)" autocomplete="new-password" required>
        </div>
        <button type="submit" class="btn btn--primary btn--sm loginbox__wide">회원가입</button>
        <p class="loginbox__links"><button type="button" class="linklike-d" data-go="login">← 로그인으로 돌아가기</button></p>
        <p class="loginbox__msg" role="status"></p>
      </form>`;
  }
  return `
    <form class="loginbox" data-mode="login" novalidate>
      <div class="loginbox__grid">
        <div class="loginbox__fields">
          <input type="email"    name="email" placeholder="이메일" autocomplete="email" required>
          <input type="password" name="password" placeholder="비밀번호" autocomplete="current-password" required>
        </div>
        <button type="submit" class="loginbox__submit">로그인</button>
      </div>
      <p class="loginbox__links">
        <button type="button" class="linklike-d" data-go="signup">회원가입</button>
        <button type="button" class="linklike-d" data-go="reset">비밀번호 찾기</button>
      </p>
      <p class="loginbox__msg" role="status"></p>
    </form>`;
}

/* 폼에 동작을 붙입니다 (여러 곳에서 재사용) */
function bindLoginForm(root) {
  const api = window.KGSA_API;
  const form = root.querySelector(".loginbox");
  if (!form || !api) return;
  const msg = form.querySelector(".loginbox__msg");
  const val = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() ?? "";

  root.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => {
    const to = b.dataset.go;
    if (to === "signup") { location.href = url("pages/join.html"); return; }   // 가입은 신청서 페이지에서
    if (to === "reset") {
      const email = prompt("가입하신 이메일을 입력하시면 비밀번호 재설정 메일을 보내드립니다.");
      if (!email?.trim()) return;
      api.resetPassword(email.trim())
        .then(() => alert("재설정 메일을 보냈습니다. 받은 메일함을 확인해 주세요."))
        .catch((e) => alert(e.message));
      return;
    }
    root.innerHTML = loginFormHTML(to);
    bindLoginForm(root);
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; msg.textContent = "처리 중…";
    try {
      if (form.dataset.mode === "signup") {
        const r = await api.signUpEmail(val("email"), val("password"), val("nickname"), { real_name: val("name") });
        msg.textContent = r.needsEmailConfirm
          ? "가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 주세요."
          : "가입되었습니다.";
        if (!r.needsEmailConfirm) location.reload();
      } else {
        await api.signInEmail(val("email"), val("password"));
        location.reload();
      }
    } catch (err) { msg.textContent = err.message; }
    btn.disabled = false;
  };
}

/* --- 로그인 영역 ---------------------------------------------------------
   백엔드가 설정돼 있으면 로그인 / 로그아웃 / 운영진 메뉴를 띄웁니다.
   설정 전(anon key 가 비어 있음)에는 기존 "회원가입" 링크만 보입니다. */
function renderAuthUI() {
  const slot   = document.getElementById("auth-slot");    // 상단 유틸바
  const action = document.getElementById("auth-action");  // 검정 내비의 주요 버튼
  const mob    = document.getElementById("auth-mobile");  // 모바일 서랍
  if (!slot) return;
  const api = window.KGSA_API;
  const esc = window.kgsaEsc || ((x) => x);
  const set = (el, html) => { if (el) el.innerHTML = html; };

  const joinLink = `<a href="${url("pages/join.html")}">회원가입</a>`;
  const rail = document.getElementById("rail-login");   // 홈 오른쪽 로그인 박스

  // 백엔드 미연결 — 동작하지 않는 로그인 버튼 대신 가입 안내를 보여 줍니다
  if (!api || !api.configured) {
    set(slot, joinLink);
    set(action, `<a class="btn btn--primary btn--sm" href="${url("pages/login.html")}">로그인</a>`);
    set(mob, `<a class="btn btn--primary" href="${url("pages/login.html")}">로그인</a>
              <a class="btn btn--outline" href="${url("pages/join.html")}">회원가입</a>`);
    if (rail) {
      rail.innerHTML = `<h2>회원 로그인</h2>
        <div class="rail-box__body" id="rail-login-form">${loginFormHTML("login")}</div>`;
      bindLoginForm(document.getElementById("rail-login-form"));
    }
    return;
  }

  if (!api.state.ready) {
    set(slot, `<span class="note">…</span>`);
    set(rail, `<h2>회원 로그인</h2><div class="rail-box__body"><p class="rail-login__msg">확인 중…</p></div>`);
    return;
  }

  if (!api.isLoggedIn()) {
    // 로그인 전 — 로그인 버튼을 항상 보이게 합니다
    set(slot, joinLink);
    set(action, `<a class="btn btn--primary btn--sm" href="${url("pages/login.html")}">로그인</a>`);
    set(mob, `<a class="btn btn--primary" href="${url("pages/login.html")}">로그인</a>
              <a class="btn btn--outline" href="${url("pages/join.html")}">회원가입</a>`);
    if (rail) {
      rail.innerHTML = `<h2>회원 로그인</h2>
        <div class="rail-box__body" id="rail-login-form">${loginFormHTML("login")}</div>`;
      bindLoginForm(document.getElementById("rail-login-form"));
    }
  } else {
    const name   = esc(api.state.profile?.display_name || "회원");
    const banned = api.bannedUntil();
    set(slot, `
      ${api.isAdmin() ? `<a href="${url("pages/admin.html")}" class="auth-admin">운영</a>` : ""}
      <span class="auth-name">${name}${banned ? " (차단됨)" : ""}</span>
      <button class="linklike" data-auth="out">로그아웃</button>`);
    set(action, `<a class="btn btn--primary btn--sm" href="${url("pages/write.html")}">글쓰기</a>`);
    set(mob, `<a class="btn btn--primary" href="${url("pages/write.html")}">글쓰기</a>
              ${api.isAdmin() ? `<a class="btn btn--outline" href="${url("pages/admin.html")}">운영</a>` : ""}
              <button class="btn btn--outline" data-auth="out">로그아웃</button>`);
    set(rail, `<h2>${name} 님</h2>
      <div class="rail-box__body">
        ${banned ? `<p class="rail-login__msg" style="color:#b4262a">차단된 계정입니다. 글쓰기가 제한됩니다.</p>` : ""}
        <a class="btn btn--primary btn--sm rail-login__btn" href="${url("pages/write.html")}">글쓰기</a>
        ${api.isAdmin() ? `<a class="btn btn--outline btn--sm rail-login__btn" href="${url("pages/admin.html")}">운영 페이지</a>` : ""}
        <p class="rail-login__sub"><button class="linklike-d" data-auth="out">로그아웃</button></p>
      </div>`);
  }

  document.querySelectorAll('[data-auth="in"]').forEach((b) =>
    b.onclick = () => api.signIn().catch((e) => alert(e.message)));
  document.querySelectorAll('[data-auth="out"]').forEach((b) =>
    b.onclick = () => api.signOut());

}

/* 게시판 페이지 아래쪽 — 페이지 번호와 같은 줄 오른쪽에 글쓰기 */
const ADMIN_ONLY_CATS = ["notice", "career"];

function renderBoardPageWrite() {
  const slot = document.getElementById("board-write-slot");
  if (!slot) return;
  const api = window.KGSA_API;
  const cat = new URLSearchParams(location.search).get("cat") || "";
  const admin  = Boolean(api?.configured && api.isAdmin());
  const banned = Boolean(api?.configured && api.isBanned());

  // 공지·취업은 운영진만
  if (ADMIN_ONLY_CATS.includes(cat) && !admin) { slot.innerHTML = ""; return; }
  if (banned) { slot.innerHTML = `<span class="note">차단된 계정은 글을 쓸 수 없습니다.</span>`; return; }

  const loggedIn = Boolean(api?.configured && api.isLoggedIn());
  const href = loggedIn
    ? `${url("pages/write.html")}${cat ? "?cat=" + cat : ""}`
    : url("pages/login.html");
  slot.innerHTML = `<a class="btn btn--primary btn--sm" href="${href}">✎ 글쓰기</a>`;
}

function initAuth() {
  const api = window.KGSA_API;
  const paint = () => {
    renderAuthUI();
    renderBoardPageWrite();
  };
  paint();
  if (!api || !api.configured) return;
  api.onChange(paint);
  api.init().then(paint);
}

/* 운영 화면에서 저장한 연락처·SNS 를 헤더·푸터에 반영합니다. */
async function applySiteSettings() {
  const api = window.KGSA_API;
  if (!api?.configured) return;
  await api.init();
  const cfg = await api.getSettings();
  if (!cfg) return;

  if (cfg.contact_email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
      a.href = "mailto:" + cfg.contact_email;
      if (a.textContent.includes("@")) a.textContent = cfg.contact_email;
    });
  }
  const social = { Instagram: cfg.instagram_url, Facebook: cfg.facebook_url };
  Object.entries(social).forEach(([label, href]) => {
    const a = document.querySelector(`.social a[aria-label="${label}"]`);
    if (a && href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
  });
  [["KakaoTalk 오픈채팅", cfg.kakao_url], ["Naver Cafe", cfg.naver_url]].forEach(([label, href]) => {
    const a = document.querySelector(`.social a[aria-label="${label}"]`);
    if (a && href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
  });

  // 문의 페이지의 '직접 연락' 목록
  document.querySelectorAll("[data-social]").forEach((li) => {
    const href = cfg[li.dataset.social];
    const a = li.querySelector("a");
    if (!a) return;
    if (href) {
      a.href = href; a.target = "_blank"; a.rel = "noopener";
      a.textContent = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    } else {
      li.hidden = true;      // 주소가 비어 있으면 줄 자체를 숨깁니다
    }
  });
}

/* --- 콘텐츠 점검 ---------------------------------------------------------
   data.js 에 문법 오류(쉼표·따옴표 누락 등)가 있으면 파일 전체가 실행되지 않아
   게시판·행사·후원업체가 통째로 비어 버립니다. 조용히 넘어가면 알아채기 어려우므로
   화면 위에 경고를 띄웁니다. (방문자에게도 보이니 발견 즉시 고쳐 주세요.) */
function checkContentLoaded() {
  if (window.KGSA_POSTS && window.KGSA_EVENTS && window.KGSA_SPONSORS) return;
  const main = document.getElementById("main");
  if (!main) return;
  const box = document.createElement("div");
  box.className = "data-error";
  box.innerHTML = `<div class="wrap">
    <strong>콘텐츠를 불러오지 못했습니다.</strong>
    <span>assets/js/data.js 에 문법 오류가 있을 수 있습니다. 방금 수정한 줄의
    쉼표( , )와 따옴표( " )가 짝이 맞는지 확인해 주세요.
    브라우저에서 <b>F12 → Console</b> 탭을 열면 몇 번째 줄이 문제인지 빨간 글씨로 알려줍니다.</span>
  </div>`;
  main.prepend(box);
}

/* --- 부팅 --------------------------------------------------------------- */
window.renderBoardPageWrite = renderBoardPageWrite;

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  checkContentLoaded();
  initAuth();
  applySiteSettings();
  initMobileNav();
  initAllMenu();
  initStickyShadow();

  renderBoardPreviews();
  renderEvents();
  renderSponsors();
  renderOfficers();
  initBoardPage();
});
