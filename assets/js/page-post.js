/* 게시글 상세 + 댓글 + 신고 */
(async () => {
  const api = window.KGSA_API;
  const esc = window.kgsaEsc, escML = window.kgsaEscMultiline;
  const raw = new URLSearchParams(location.search).get("id");
  const id = /^\d+$/.test(raw || "") ? Number(raw) : null;   // 숫자만 허용
  const $ = (s) => document.querySelector(s);

  const CATS = { notice:"공지사항", career:"취업 · 인턴", market:"벼룩시장",
                 housing:"하우징", community:"자유게시판" };
  const fmt = (iso) => new Date(iso).toLocaleString("ko-KR",
    { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });

  const live = Boolean(api?.configured);
  if (live) await api.init();

  /* 백엔드가 없으면 data.js 의 예시 글을 그대로 보여 줍니다. */
  const fromLocal = (n) => {
    const p = (window.KGSA_POSTS || []).find((x) => x.id === n);
    if (!p) return null;
    return { id: p.id, cat: p.cat, title: p.title, body: p.body || "",
             images: [], badge: p.badge, created_at: p.date + "T00:00:00",
             author_id: null, author: { display_name: p.author } };
  };

  const post = id ? (live ? await api.getPost(id) : fromLocal(id)) : null;
  if (!post) {
    $("#p-title").textContent = "글을 찾을 수 없습니다";
    $("#p-body").innerHTML = `<p class="note">삭제되었거나 주소가 잘못되었습니다.
      <a href="board.html">게시판으로 돌아가기</a></p>`;
    return;
  }

  document.title = `${post.title} · CU Boulder KGSA`;
  $("#p-title").textContent = post.title;
  $("#p-meta").innerHTML =
    `<span class="cat-chip">${esc(CATS[post.cat] || post.cat)}</span>
     &nbsp; ${esc(post.author?.display_name || "탈퇴한 회원")} · ${esc(fmt(post.created_at))}`;
  $("#p-body").innerHTML = escML(post.body);

  $("#p-images").innerHTML = (post.images || [])
    .map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="첨부 사진" loading="lazy"></a>`)
    .join("");

  /* 도구 모음 — 본인 글이면 수정/삭제, 아니면 신고 */
  if (!live) {
    $("#p-tools").innerHTML =
      `<a class="btn btn--outline btn--sm" href="board.html?cat=${esc(post.cat)}">목록</a>`;
    document.getElementById("c-list").innerHTML =
      `<p class="note" style="padding:10px 2px">댓글은 게시판 연결 후 이용할 수 있습니다.</p>`;
    document.getElementById("c-count").textContent = "";
    return;
  }
  const mine = api.isLoggedIn() && post.author_id === api.state.user.id;
  const tools = [];
  if (mine || api.isAdmin()) {
    tools.push(`<a class="btn btn--outline btn--sm" href="write.html?id=${post.id}">수정</a>`);
    tools.push(`<button class="btn btn--outline btn--sm" id="t-del">삭제</button>`);
  }
  if (api.isAdmin()) {
    tools.push(`<button class="btn btn--outline btn--sm" id="t-pin">공지 고정</button>`);
    tools.push(`<button class="btn btn--outline btn--sm" id="t-hide">숨기기</button>`);
  }
  if (!mine) tools.push(`<button class="btn btn--outline btn--sm" id="t-report">🚩 신고</button>`);
  tools.push(`<a class="btn btn--outline btn--sm" href="board.html?cat=${esc(post.cat)}">목록</a>`);
  $("#p-tools").innerHTML = tools.join("");

  $("#t-del")?.addEventListener("click", async () => {
    if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    try { await api.deletePost(post.id); location.href = `board.html?cat=${post.cat}`; }
    catch (e) { alert("삭제 실패: " + e.message); }
  });
  $("#t-pin")?.addEventListener("click", async () => {
    try { await api.admin.setBadge(post.id, post.badge === "pin" ? null : "pin"); location.reload(); }
    catch (e) { alert(e.message); }
  });
  $("#t-hide")?.addEventListener("click", async () => {
    if (!confirm("이 글을 숨길까요? 작성자는 되살릴 수 없습니다.")) return;
    try { await api.admin.hide("post", post.id, true); location.href = "board.html"; }
    catch (e) { alert(e.message); }
  });
  $("#t-report")?.addEventListener("click", async () => {
    if (!api.isLoggedIn()) return alert("신고하려면 로그인이 필요합니다.");
    const reason = prompt("신고 사유를 적어 주세요. (광고/사기/욕설 등)");
    if (!reason?.trim()) return;
    try { await api.report("post", post.id, reason.trim()); alert("신고가 접수되었습니다. 운영진이 확인합니다."); }
    catch (e) { alert(e.message); }
  });

  /* ---- 댓글 ---- */
  async function drawComments() {
    const list = await api.listComments(post.id);
    document.getElementById("c-count").textContent = `(${list.length})`;
    document.getElementById("c-list").innerHTML = list.length
      ? list.map((c) => {
          const own = api.isLoggedIn() && c.author_id === api.state.user.id;
          return `<div class="comment">
            <div class="comment__head">
              <b>${esc(c.author?.display_name || "탈퇴한 회원")}</b>
              <span>${esc(fmt(c.created_at))}</span>
              <span class="comment__tools">
                ${own || api.isAdmin() ? `<button class="linklike-d" data-cdel="${c.id}">삭제</button>` : ""}
                ${!own ? `<button class="linklike-d" data-crep="${c.id}">신고</button>` : ""}
              </span>
            </div>
            <div class="comment__body">${escML(c.body)}</div>
          </div>`;
        }).join("")
      : `<p class="note" style="padding:10px 2px">첫 댓글을 남겨 보세요.</p>`;

    document.querySelectorAll("[data-cdel]").forEach((b) => b.onclick = async () => {
      if (!confirm("댓글을 삭제할까요?")) return;
      try { await api.deleteComment(Number(b.dataset.cdel)); drawComments(); }
      catch (e) { alert(e.message); }
    });
    document.querySelectorAll("[data-crep]").forEach((b) => b.onclick = async () => {
      const reason = prompt("신고 사유를 적어 주세요.");
      if (!reason?.trim()) return;
      try { await api.report("comment", Number(b.dataset.crep), reason.trim()); alert("신고가 접수되었습니다."); }
      catch (e) { alert(e.message); }
    });
  }

  function drawCommentForm() {
    const box = document.getElementById("c-form-box");
    if (!api.isLoggedIn()) {
      box.innerHTML = `<p class="note">댓글을 쓰려면 로그인이 필요합니다.
        <a href="login.html">로그인</a> · <a href="join.html">회원가입</a></p>`;
      return;
    }
    if (api.isBanned()) { box.innerHTML = `<p class="note">차단된 계정은 댓글을 쓸 수 없습니다.</p>`; return; }
    box.innerHTML = `<div class="field"><textarea id="c-body" maxlength="2000"
        placeholder="댓글을 입력하세요" style="min-height:80px"></textarea></div>
      <button class="btn btn--primary btn--sm" id="c-send" style="margin-top:8px">댓글 등록</button>`;
    document.getElementById("c-send").onclick = async () => {
      const t = document.getElementById("c-body").value.trim();
      if (!t) return;
      try { await api.addComment(post.id, t); document.getElementById("c-body").value = ""; drawComments(); }
      catch (e) { alert(e.message); }
    };
  }

  drawComments(); drawCommentForm();
})();
