/* 운영진 페이지 — 신고 처리 · 계정 차단 */
(async () => {
  const api = window.KGSA_API, esc = window.kgsaEsc;
  const gate = document.getElementById("admin-gate");
  const body = document.getElementById("admin-body");
  const fmt = (iso) => new Date(iso).toLocaleDateString("ko-KR");

  const deny = (html) => { gate.innerHTML = html; gate.hidden = false; body.hidden = true; };

  if (!api?.configured) return deny(`<p class="note">백엔드가 아직 설정되지 않았습니다.</p>`);
  await api.init();
  if (!api.isLoggedIn()) {
    deny(`<p>운영진 계정으로 로그인해 주세요.</p>
      <p style="margin-top:12px"><a class="btn btn--primary btn--sm" href="login.html">로그인</a></p>`);
    return;
  }
  if (!api.isAdmin()) return deny(`<p><strong>접근 권한이 없습니다.</strong></p>
    <p class="note" style="margin-top:8px">운영진 권한이 필요합니다. 기존 운영진에게 요청해 주세요.</p>`);

  gate.hidden = true; body.hidden = false;

  /* 탭 */
  const TABS = ["reports", "users", "events", "sponsors", "officers", "settings"];
  document.getElementById("admin-tabs").onclick = (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    const t = b.dataset.tab;
    document.querySelectorAll("#admin-tabs .tab").forEach((x) => x.classList.toggle("is-active", x === b));
    TABS.forEach((k) => { const el = document.getElementById("tab-" + k); if (el) el.hidden = k !== t; });
    if (t === "users") drawUsers();
    if (["events", "sponsors", "officers"].includes(t)) drawEditor(t);
    if (t === "settings") drawSettings();
  };

  /* ── 행사 · 후원업체 · 임원진 편집기 ────────────────────────────────
     한 화면에서 추가·수정·삭제합니다. 저장 즉시 사이트에 반영되며
     파일을 고치거나 사이트를 다시 올릴 필요가 없습니다. */
  const SCHEMA = {
    events: {
      label: "행사",
      fields: [
        { k: "date",      t: "date", label: "날짜", required: true },
        { k: "title",     t: "text", label: "행사 이름", required: true },
        { k: "descr",     t: "text", label: "한 줄 설명" },
        { k: "location",  t: "text", label: "장소" },
        { k: "time_text", t: "text", label: "시간 (예: 오후 6:00)" },
      ],
      blank: { date: "", title: "", descr: "", location: "", time_text: "", sort_order: 0 },
      summary: (r) => `${r.date} · ${r.title}`,
    },
    sponsors: {
      label: "후원업체",
      fields: [
        { k: "name",     t: "text", label: "업체 이름", required: true },
        { k: "category", t: "text", label: "업종 한 줄" },
        { k: "phone",    t: "text", label: "전화번호" },
        { k: "area",     t: "text", label: "지역 (예: Boulder, CO)" },
        { k: "logo_url", t: "text", label: "로고 이미지 주소 (선택)" },
        { k: "url",      t: "text", label: "홈페이지 주소 (없으면 비워두기)" },
        { k: "sort_order", t: "number", label: "표시 순서" },
      ],
      blank: { name: "", category: "", phone: "", area: "", logo_url: "", url: "#", sort_order: 0 },
      summary: (r) => `${r.name}${r.category ? " · " + r.category : ""}`,
    },
    officers: {
      label: "임원",
      fields: [
        { k: "photo_url", t: "image", label: "사진" },
        { k: "name", t: "text", label: "이름", required: true },
        { k: "role", t: "text", label: "직책 (예: President)" },
        { k: "dept", t: "text", label: "학과" },
        { k: "sort_order", t: "number", label: "표시 순서" },
      ],
      blank: { name: "", role: "", dept: "", photo_url: "", sort_order: 0 },
      summary: (r) => `${r.name}${r.role ? " · " + r.role : ""}`,
    },
  };

  async function drawEditor(kind) {
    const box = document.getElementById("ed-" + kind);
    const def = SCHEMA[kind];
    box.innerHTML = `<p class="note">불러오는 중…</p>`;
    const rows = await api.listContent(kind);
    if (rows === null) { box.innerHTML = `<p class="note">불러오지 못했습니다.</p>`; return; }

    const imageField = (f, r) => {
      const val = r[f.k] ?? "";
      return `<div class="field">
        <label>${esc(f.label)}</label>
        <div class="photo-field">
          <div class="photo-field__preview"${val ? "" : ' hidden'} data-photo-preview>
            ${val ? `<img src="${esc(val)}" alt="">` : ""}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-photo-input>
          <button type="button" class="btn btn--outline btn--sm" data-photo-clear${val ? "" : " hidden"}>사진 제거</button>
        </div>
        <input type="hidden" data-k="${f.k}" value="${esc(val)}">
        <p class="form-note" data-photo-msg></p>
      </div>`;
    };

    const card = (r) => {
      const isNew = !r.id;
      return `<div class="panel ed-card" data-id="${r.id || ""}">
        ${isNew ? `<h3>새 ${esc(def.label)} 추가</h3>` : `<h3>${esc(def.summary(r))}</h3>`}
        <div class="form-grid">
          ${def.fields.map((f) => f.t === "image" ? imageField(f, r) : `
            <div class="field">
              <label>${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ""}</label>
              <input type="${f.t}" data-k="${f.k}" value="${esc(r[f.k] ?? "")}">
            </div>`).join("")}
          <div class="write-actions">
            <button class="btn btn--primary btn--sm" data-save>${isNew ? "추가" : "저장"}</button>
            ${isNew ? "" : `<button class="btn btn--outline btn--sm" data-del>삭제</button>`}
          </div>
          <p class="form-note" data-msg></p>
        </div>
      </div>`;
    };

    box.innerHTML = rows.map(card).join("") + card({ ...def.blank });

    box.querySelectorAll(".ed-card").forEach((cardEl) => {
      const id = cardEl.dataset.id ? Number(cardEl.dataset.id) : null;
      const msg = cardEl.querySelector("[data-msg]");

      /* 사진 업로드 — 선택 즉시 올리고, 성공하면 hidden input 에 주소를 채웁니다 */
      cardEl.querySelectorAll("[data-photo-input]").forEach((fileInput) => {
        const field = fileInput.closest(".field");
        const hidden  = field.querySelector("[data-k]");
        const preview = field.querySelector("[data-photo-preview]");
        const clearBtn = field.querySelector("[data-photo-clear]");
        const pmsg = field.querySelector("[data-photo-msg]");

        fileInput.onchange = async () => {
          const file = fileInput.files?.[0];
          if (!file) return;
          pmsg.textContent = "업로드 중…";
          try {
            const url = await api.uploadImage(file);
            hidden.value = url;
            preview.innerHTML = `<img src="${url}" alt="">`;
            preview.hidden = false;
            clearBtn.hidden = false;
            pmsg.textContent = "업로드 완료. 저장을 눌러 반영해 주세요.";
          } catch (e) {
            pmsg.textContent = "업로드 실패: " + e.message;
          }
          fileInput.value = "";
        };
        clearBtn.onclick = () => {
          hidden.value = "";
          preview.innerHTML = "";
          preview.hidden = true;
          clearBtn.hidden = true;
          pmsg.textContent = "";
        };
      });

      const read = () => {
        const o = {};
        cardEl.querySelectorAll("[data-k]").forEach((i) => {
          o[i.dataset.k] = i.type === "number" ? Number(i.value || 0) : i.value.trim();
        });
        return o;
      };
      cardEl.querySelector("[data-save]").onclick = async () => {
        const row = read();
        const miss = def.fields.filter((f) => f.required && !row[f.k]);
        if (miss.length) { msg.textContent = `${miss[0].label}을(를) 입력해 주세요.`; return; }
        if (kind === "sponsors" && !row.url) row.url = "#";
        msg.textContent = "저장 중…";
        try { await api.admin.saveContent(kind, id ? { id, ...row } : row); drawEditor(kind); }
        catch (e) { msg.textContent = "저장 실패: " + e.message; }
      };
      cardEl.querySelector("[data-del]")?.addEventListener("click", async () => {
        if (!confirm("삭제할까요?")) return;
        try { await api.admin.deleteContent(kind, id); drawEditor(kind); }
        catch (e) { msg.textContent = "삭제 실패: " + e.message; }
      });
    });
  }

  /* ── 연락처 · SNS ─────────────────────────────────────────────────── */
  const SETTING_LABELS = {
    contact_email: "대표 이메일",
    instagram_url: "인스타그램 주소",
    facebook_url:  "페이스북 주소",
    kakao_url:     "카카오톡 오픈채팅 주소",
    naver_url:     "네이버 카페 주소",
  };
  async function drawSettings() {
    const box = document.getElementById("settings-form");
    box.innerHTML = `<p class="note">불러오는 중…</p>`;
    const cur = await api.getSettings();
    if (cur === null) { box.innerHTML = `<p class="note">불러오지 못했습니다.</p>`; return; }
    box.innerHTML = Object.entries(SETTING_LABELS).map(([k, label]) => `
      <div class="field">
        <label>${esc(label)}</label>
        <input type="text" data-s="${k}" value="${esc(cur[k] ?? "")}">
      </div>`).join("") +
      `<div class="write-actions"><button class="btn btn--primary btn--sm" id="s-save">저장</button></div>
       <p class="form-note" id="s-msg"></p>`;
    document.getElementById("s-save").onclick = async () => {
      const m = document.getElementById("s-msg");
      m.textContent = "저장 중…";
      try {
        for (const i of box.querySelectorAll("[data-s]")) await api.admin.saveSetting(i.dataset.s, i.value.trim());
        m.textContent = "저장했습니다. 사이트에 바로 반영됩니다.";
      } catch (e) { m.textContent = "저장 실패: " + e.message; }
    };
  }

  /* ---- 신고 ---- */
  async function drawReports() {
    const rows = await api.admin.listReports("open");
    document.getElementById("rep-count").textContent = `미처리 ${rows.length}건`;
    const tb = document.getElementById("rep-tbody");
    tb.innerHTML = rows.length ? rows.map((r) => `
      <tr>
        <td><span class="cat-chip">${r.target_type === "post" ? "게시글" : "댓글"}</span></td>
        <td>
          <div>${esc(r.reason)}</div>
          ${r.target_type === "post"
            ? `<a class="link-more" href="post.html?id=${r.target_id}" target="_blank" rel="noopener">글 보기 ↗</a>`
            : `<span class="note">댓글 #${r.target_id}</span>`}
        </td>
        <td>${esc(r.reporter?.display_name || "-")}</td>
        <td class="c-date">${esc(fmt(r.created_at))}</td>
        <td>
          <button class="btn btn--outline btn--sm" data-hide="${r.id}" data-k="${r.target_type}" data-t="${r.target_id}">숨김</button>
          <button class="btn btn--outline btn--sm" data-ok="${r.id}">처리완료</button>
          <button class="btn btn--outline btn--sm" data-no="${r.id}">기각</button>
        </td>
      </tr>`).join("")
      : `<tr><td colspan="5"><div class="empty-state">처리할 신고가 없습니다.</div></td></tr>`;

    tb.querySelectorAll("[data-hide]").forEach((b) => b.onclick = async () => {
      if (!confirm("해당 글/댓글을 숨길까요?")) return;
      try {
        await api.admin.hide(b.dataset.k, Number(b.dataset.t), true);
        await api.admin.resolveReport(Number(b.dataset.hide), "resolved");
        drawReports();
      } catch (e) { alert(e.message); }
    });
    tb.querySelectorAll("[data-ok]").forEach((b) => b.onclick = async () => {
      try { await api.admin.resolveReport(Number(b.dataset.ok), "resolved"); drawReports(); }
      catch (e) { alert(e.message); }
    });
    tb.querySelectorAll("[data-no]").forEach((b) => b.onclick = async () => {
      try { await api.admin.resolveReport(Number(b.dataset.no), "dismissed"); drawReports(); }
      catch (e) { alert(e.message); }
    });
  }

  /* ---- 회원 · 차단 ---- */
  async function drawUsers() {
    const q = document.getElementById("u-search").value.trim();
    let rows = [];
    try { rows = await api.admin.listUsers(q); }
    catch (e) { document.getElementById("u-tbody").innerHTML =
      `<tr><td colspan="5"><div class="empty-state">${esc(e.message)}</div></td></tr>`; return; }

    const tb = document.getElementById("u-tbody");
    tb.innerHTML = rows.length ? rows.map((u) => {
      const until = u.banned_until ? new Date(u.banned_until) : null;
      const active = until && until > new Date();
      const label = !active ? `<span class="note">정상</span>`
        : `<span class="tag tag--hot">차단${until.getFullYear() > 9000 ? " (영구)" : ` ~${fmt(u.banned_until)}`}</span>`;
      return `<tr>
        <td>
          <div><b>${esc(u.display_name)}</b> ${u.role !== "member" ? `<span class="cat-chip">${esc(u.role)}</span>` : ""}</div>
          <div class="note">${u.real_name ? "실명: " + esc(u.real_name) + " · " : ""}${esc(u.email || "")}${u.dept ? " · " + esc(u.dept) : ""}${u.status ? " · " + esc(u.status) : ""}</div>
          ${u.ban_reason ? `<div class="note">사유: ${esc(u.ban_reason)}</div>` : ""}
        </td>
        <td>${u.post_count}</td>
        <td>${u.report_count}</td>
        <td>${label}</td>
        <td>
          ${active
            ? `<button class="btn btn--outline btn--sm" data-unban="${u.id}">차단 해제</button>`
            : `<button class="btn btn--outline btn--sm" data-ban="${u.id}" data-d="7">7일</button>
               <button class="btn btn--outline btn--sm" data-ban="${u.id}" data-d="30">30일</button>
               <button class="btn btn--outline btn--sm" data-ban="${u.id}" data-d="">영구+글삭제</button>`}
        </td>
      </tr>`;
    }).join("") : `<tr><td colspan="5"><div class="empty-state">회원이 없습니다.</div></td></tr>`;

    tb.querySelectorAll("[data-ban]").forEach((b) => b.onclick = async () => {
      const perm = b.dataset.d === "";
      const days = perm ? null : Number(b.dataset.d);
      const reason = prompt(perm ? "영구 차단 사유 (스팸/사기 등)" : `${days}일 차단 사유`);
      if (reason === null) return;
      if (!confirm(perm ? "영구 차단하고 이 계정의 글·댓글을 전부 숨깁니다. 진행할까요?"
                        : `${days}일간 차단합니다. 진행할까요?`)) return;
      try { await api.admin.ban(b.dataset.ban, days, reason, perm); drawUsers(); }
      catch (e) { alert(e.message); }
    });
    tb.querySelectorAll("[data-unban]").forEach((b) => b.onclick = async () => {
      try { await api.admin.unban(b.dataset.unban); drawUsers(); }
      catch (e) { alert(e.message); }
    });
  }

  let t; document.getElementById("u-search").oninput = () => { clearTimeout(t); t = setTimeout(drawUsers, 300); };
  drawReports();
})();
