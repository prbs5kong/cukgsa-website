/* 글쓰기 / 수정 페이지 */
(async () => {
  const api = window.KGSA_API, esc = window.kgsaEsc;
  const gate = document.getElementById("gate");
  const form = document.getElementById("write-form");
  const msg  = document.getElementById("w-msg");
  const thumbs = document.getElementById("w-thumbs");
  const rawId = new URLSearchParams(location.search).get("id");
  const editId = /^\d+$/.test(rawId || "") ? Number(rawId) : null;   // 숫자만 허용
  let images = [];

  const show = (html) => { gate.innerHTML = html; gate.hidden = false; form.hidden = true; };

  if (!api?.configured) {
    return show(`<p class="note">게시판 기능이 아직 설정되지 않았습니다.
      <code>assets/js/supabase-config.js</code> 를 채워 주세요.</p>`);
  }
  await api.init();

  if (!api.isLoggedIn()) {
    show(`<p>글을 쓰려면 로그인이 필요합니다.</p>
      <div class="write-actions" style="margin-top:12px">
        <a class="btn btn--primary btn--sm" href="login.html">로그인</a>
        <a class="btn btn--outline btn--sm" href="join.html">회원가입</a>
      </div>`);
    return;
  }
  const banned = api.bannedUntil();
  if (banned) {
    const until = banned.getFullYear() > 9000 ? "영구" : banned.toLocaleDateString("ko-KR");
    return show(`<p><strong>차단된 계정입니다.</strong></p>
      <p class="note" style="margin-top:8px">해제 예정: ${esc(until)}<br>
      사유: ${esc(api.state.profile?.ban_reason || "명시되지 않음")}<br>
      이의가 있으시면 <a href="contact.html">문의 페이지</a>로 연락 주세요.</p>`);
  }

  gate.hidden = true; form.hidden = false;

  // 운영진이 아니면 공지사항 선택지 제거
  if (!api.isAdmin()) document.querySelectorAll("[data-admin-only]").forEach((o) => o.remove());

  // 게시판 카드에서 넘어온 경우 해당 분류를 미리 선택
  const preCat = new URLSearchParams(location.search).get("cat");
  const catSel = document.getElementById("w-cat");
  if (preCat && [...catSel.options].some((o) => o.value === preCat)) catSel.value = preCat;

  // 수정 모드
  if (editId) {
    const post = await api.getPost(editId);
    if (!post) return show(`<p class="note">글을 찾을 수 없습니다.</p>`);
    if (post.author_id !== api.state.user.id && !api.isAdmin()) {
      return show(`<p class="note">본인이 쓴 글만 수정할 수 있습니다.</p>`);
    }
    document.getElementById("page-title").textContent = "글 수정";
    document.getElementById("crumb").textContent = "글 수정";
    document.getElementById("w-cat").value = post.cat;
    document.getElementById("w-cat").disabled = true;
    document.getElementById("w-title").value = post.title;
    document.getElementById("w-body").value = post.body;
    images = [...(post.images || [])];
    drawThumbs();
  }

  function drawThumbs() {
    thumbs.innerHTML = images.map((u, i) =>
      `<span class="thumb"><img src="${esc(u)}" alt="">
        <button type="button" class="thumb-x" data-i="${i}" aria-label="사진 삭제">✕</button></span>`).join("");
    thumbs.querySelectorAll(".thumb-x").forEach((b) =>
      b.onclick = () => { images.splice(Number(b.dataset.i), 1); drawThumbs(); });
  }

  document.getElementById("w-images").onchange = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    for (const f of files) {
      if (images.length >= 8) { msg.textContent = "사진은 최대 8장까지 가능합니다."; break; }
      msg.textContent = `사진 올리는 중… (${f.name})`;
      try { images.push(await api.uploadImage(f)); drawThumbs(); msg.textContent = ""; }
      catch (err) { msg.textContent = "사진 업로드 실패: " + err.message; }
    }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const btn = document.getElementById("w-submit");
    btn.disabled = true; msg.textContent = "저장 중…";
    const payload = {
      cat:   document.getElementById("w-cat").value,
      title: document.getElementById("w-title").value.trim(),
      body:  document.getElementById("w-body").value.trim(),
      images,
    };
    try {
      if (editId) { await api.updatePost(editId, payload); location.href = `post.html?id=${editId}`; }
      else        { const id = await api.createPost(payload); location.href = `post.html?id=${id}`; }
    } catch (err) {
      msg.textContent = "저장 실패: " + err.message;
      btn.disabled = false;
    }
  };
})();
