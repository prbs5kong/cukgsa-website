/* 백엔드 연결 상태 점검 — 설정이 어디서 막혔는지 알려줍니다. */
(async () => {
  const esc = window.kgsaEsc || ((x) => x);
  const box = document.getElementById("check-list");
  const cfg = window.KGSA_SUPABASE || {};
  const rows = [];

  const add = (ok, title, detail, howto) =>
    rows.push({ ok, title, detail, howto });

  const paint = () => {
    box.innerHTML = rows.map((r) => `
      <div class="chk chk--${r.ok === true ? "ok" : r.ok === false ? "no" : "wait"}">
        <div class="chk__mark">${r.ok === true ? "✓" : r.ok === false ? "✕" : "…"}</div>
        <div class="chk__body">
          <h3>${esc(r.title)}</h3>
          ${r.detail ? `<p>${esc(r.detail)}</p>` : ""}
          ${r.howto ? `<p class="chk__how">→ ${r.howto}</p>` : ""}
        </div>
      </div>`).join("");
  };

  const GUIDE = '<a href="../supabase/설치방법.md">supabase/설치방법.md</a>';

  /* 1. 설정 파일 */
  if (!cfg.url || !cfg.anonKey) {
    add(false, "1. 접속 정보 입력", "assets/js/supabase-config.js 가 비어 있습니다.",
        `Supabase → Settings → API 에서 <b>Project URL</b> 과 <b>anon key</b> 를 복사해 넣으세요. ${GUIDE} 4장`);
    paint(); return;
  }
  if (/service_role/i.test(cfg.anonKey)) {
    add(false, "1. 접속 정보 입력", "service_role 키가 들어 있습니다.",
        "즉시 anon(public) 키로 바꾸고, Supabase 에서 service_role 키를 재발급하세요. 전권 키라 노출되면 위험합니다.");
    paint(); return;
  }
  add(true, "1. 접속 정보 입력", cfg.url);

  /* 2. SDK */
  if (!window.supabase?.createClient) {
    add(false, "2. Supabase 라이브러리", "라이브러리를 불러오지 못했습니다.",
        "인터넷 연결 또는 광고 차단 확장을 확인하세요.");
    paint(); return;
  }
  add(true, "2. Supabase 라이브러리", "정상 로드");
  paint();

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  /* 3. 프로젝트 연결 + 테이블 */
  const TABLES = ["profiles", "posts", "comments", "reports", "events", "sponsors", "officers", "site_settings"];
  const missing = [];
  let reachable = true;
  for (const t of TABLES) {
    const { error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (!error) continue;
    if (/Failed to fetch|NetworkError/i.test(error.message)) { reachable = false; break; }
    if (error.code === "42P01" || /does not exist|schema cache/i.test(error.message)) missing.push(t);
  }

  if (!reachable) {
    add(false, "3. 프로젝트 연결", "프로젝트에 접속하지 못했습니다.",
        "Project URL 오타이거나, 무료 프로젝트가 일시정지된 상태일 수 있습니다. Supabase 대시보드에서 프로젝트를 깨워 주세요.");
    paint(); return;
  }
  add(true, "3. 프로젝트 연결", "접속 성공");

  if (missing.length) {
    add(false, "4. 테이블 생성", `없는 테이블: ${missing.join(", ")}`,
        `Supabase → SQL Editor 에 <code>supabase/schema.sql</code> 전체를 붙여넣고 RUN 하세요. ${GUIDE} 2장`);
    paint(); return;
  }
  add(true, "4. 테이블 생성", `${TABLES.length}개 테이블 확인`);

  /* 5. 사진 저장소 */
  const { error: bErr } = await sb.storage.from("post-images").list("", { limit: 1 });
  add(!bErr, "5. 사진 저장소", bErr ? bErr.message : "post-images 버킷 정상",
      bErr ? "schema.sql 의 7번 항목이 실행됐는지 확인하세요." : "");
  paint();

  /* 6. 로그인 */
  const { data: sess } = await sb.auth.getSession();
  const user = sess?.session?.user ?? null;
  if (!user) {
    add(null, "6. 로그인", "아직 로그인하지 않았습니다.",
        `<a class="btn btn--primary btn--sm" href="login.html">로그인 페이지로 이동</a>
         <a class="btn btn--outline btn--sm" href="join.html">회원가입</a>
         <br><span class="note">가입은 되는데 로그인이 안 되면, Supabase → Authentication →
         Email 의 <b>Confirm email</b> 이 켜져 있는 것입니다. 끄세요. (${GUIDE} 3장)</span>`);
    paint();
    return;
  }
  add(true, "6. 로그인", user.email || user.id);

  /* 7. 프로필 자동 생성 */
  const { data: prof, error: pErr } = await sb.from("profiles")
    .select("id, display_name, role").eq("id", user.id).maybeSingle();
  if (pErr || !prof) {
    add(false, "7. 프로필 생성", pErr ? pErr.message : "프로필이 만들어지지 않았습니다.",
        "schema.sql 의 handle_new_user 트리거가 없을 수 있습니다. schema.sql 을 다시 RUN 한 뒤 로그아웃 → 재로그인 해보세요.");
    paint(); return;
  }
  add(true, "7. 프로필 생성", `${prof.display_name} (권한: ${prof.role})`);

  /* 8. 관리자 권한 */
  const isAdmin = ["admin", "officer"].includes(prof.role);
  if (!isAdmin) {
    add(false, "8. 관리자 권한", `현재 권한은 '${prof.role}' 입니다.`,
        `Supabase → SQL Editor 에서 실행하세요:<br>
         <code>update public.profiles set role = 'admin' where email = '${esc(user.email || "")}';</code>
         <br>그 뒤 이 페이지를 새로고침하세요.`);
    paint(); return;
  }
  add(true, "8. 관리자 권한", prof.role);
  paint();

  /* 9. 쓰기 권한 (기존 값을 그대로 다시 저장 — 내용이 바뀌지 않습니다) */
  const { data: st } = await sb.from("site_settings").select("key, value").eq("key", "contact_email").maybeSingle();
  const { error: wErr } = await sb.from("site_settings")
    .upsert({ key: "contact_email", value: st?.value ?? "kgsa@colorado.edu" }, { onConflict: "key" });
  add(!wErr, "9. 쓰기 권한", wErr ? wErr.message : "운영 화면에서 수정할 수 있습니다",
      wErr ? "schema.sql 의 8번 항목(정책·GRANT)이 실행됐는지 확인하세요." : "");

  add(true, "모두 완료", "이제 운영 메뉴에서 행사 · 후원업체 · 임원진을 직접 수정할 수 있습니다.",
      `<a class="btn btn--primary btn--sm" href="admin.html">운영 페이지로 이동</a>`);
  paint();
})();
