/* 게시판 목록 — 백엔드가 설정돼 있으면 DB에서, 아니면 data.js 예시로 */
(async () => {
  const api = window.KGSA_API, esc = window.kgsaEsc;
  const tbody = document.getElementById("post-tbody");
  if (!tbody || !api?.configured) return;   // 미설정이면 main.js 의 정적 렌더가 담당

  window.KGSA_BOARD_LIVE = true;            // main.js 의 정적 렌더 비활성화 신호
  await api.init();

  const PER = 12;
  const params = new URLSearchParams(location.search);
  const state = { cat: params.get("cat") || "", q: "", page: 1 };

  const tabs = document.getElementById("board-tabs");
  const search = document.getElementById("board-search");
  const pager = document.getElementById("board-pager");
  const countEl = document.getElementById("board-count");
  const catName = (id) => (window.KGSA_CATEGORIES || []).find((c) => c.id === id)?.name || id;
  const fmt = (iso) => new Date(iso).toLocaleDateString("ko-KR").replace(/\.$/, "");
  const badgeHTML = (b) => b === "pin" ? `<span class="tag tag--pin">공지</span>`
                       : b === "new" ? `<span class="tag tag--new">NEW</span>`
                       : b === "hot" ? `<span class="tag tag--hot">HOT</span>` : "";

  function renderTabs() {
    const cats = [{ id: "", name: "전체" }, ...(window.KGSA_CATEGORIES || [])];
    tabs.innerHTML = cats.map((c) =>
      `<button class="tab${state.cat === c.id ? " is-active" : ""}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`).join("");
  }

  async function render() {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">불러오는 중…</div></td></tr>`;
    const { rows, count, error } = await api.listPosts({ ...state, perPage: PER });

    if (error) {
      countEl.textContent = "";
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">게시글을 불러오지 못했습니다.<br>
        <span class="note">${esc(error.message || "")}</span></div></td></tr>`;
      return;
    }

    countEl.textContent = `총 ${count}건`;
    tbody.innerHTML = rows.length ? rows.map((p) => `
      <tr>
        <td class="c-cat"><span class="cat-chip">${esc(catName(p.cat))}</span></td>
        <td><a class="post-cell" href="post.html?id=${p.id}">
          ${badgeHTML(p.badge)}
          <span${p.badge === "pin" ? ' class="is-pinned-title"' : ""}>${esc(p.title)}</span>
          ${p.images?.length ? `<span class="note">🖼 ${p.images.length}</span>` : ""}
        </a></td>
        <td class="c-author">${esc(p.author?.display_name || "-")}</td>
        <td class="c-date">${esc(fmt(p.created_at))}</td>
      </tr>`).join("")
      : `<tr><td colspan="4"><div class="empty-state">${state.q ? "검색 결과가 없습니다." : "아직 등록된 글이 없습니다. 첫 글을 남겨 보세요."}</div></td></tr>`;

    const pages = Math.max(1, Math.ceil(count / PER));
    pager.innerHTML =
      `<button ${state.page === 1 ? "disabled" : ""} data-page="${state.page - 1}" aria-label="이전">←</button>` +
      Array.from({ length: pages }, (_, i) =>
        `<button class="${state.page === i + 1 ? "is-active" : ""}" data-page="${i + 1}">${i + 1}</button>`).join("") +
      `<button ${state.page === pages ? "disabled" : ""} data-page="${state.page + 1}" aria-label="다음">→</button>`;
    renderTabs();
  }

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    state.cat = b.dataset.cat; state.page = 1; render();
    history.replaceState(null, "", state.cat ? `?cat=${state.cat}` : location.pathname);
    window.renderBoardPageWrite?.();
  });
  let t; search.addEventListener("input", (e) => {
    clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; state.page = 1; render(); }, 250);
  });
  pager.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-page]"); if (!b || b.disabled) return;
    state.page = Number(b.dataset.page); render();
    document.getElementById("board-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
})();
