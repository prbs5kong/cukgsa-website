/* ==========================================================================
   CU Boulder KGSA — 백엔드 연동 계층
   Supabase 인증 / 게시글 / 댓글 / 신고 / 운영진 기능
   ========================================================================== */

/* --- 0. XSS 방지 ---------------------------------------------------------
   회원이 쓴 글을 화면에 넣을 때는 반드시 esc() 를 통과시켜야 합니다.
   이걸 빠뜨리면 <script> 를 제목에 넣는 것만으로 사이트가 뚫립니다.       */
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* 줄바꿈만 살리고 나머지는 전부 escape.
   escape 뒤에 http(s) 주소만 링크로 바꿉니다 (순서가 중요 — 반대로 하면 XSS 구멍) */
const escMultiline = (v) =>
  esc(v)
    .replace(/(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\r?\n/g, "<br>");

/* 외부 링크 허용 여부 — javascript: 같은 위험한 스킴 차단 */
const safeUrl = (u) => {
  const s = String(u ?? "").trim();
  return /^https?:\/\//i.test(s) ? s : "#";
};

/* --- 1. 클라이언트 -------------------------------------------------------- */
const ROOT_PATH = (() => {
  const p = location.pathname;
  return p.includes("/pages/") ? p.slice(0, p.indexOf("/pages/") + 1) : p.replace(/[^/]*$/, "");
})();

const KGSA = (() => {
  const cfg = window.KGSA_SUPABASE || {};
  const configured = Boolean(cfg.url && cfg.anonKey);
  let sb = null;

  if (configured && window.supabase?.createClient) {
    sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  /* 현재 로그인 상태 (부팅 시 1회 채움) */
  const state = { user: null, profile: null, ready: false };

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });

  async function loadProfile() {
    if (!sb || !state.user) { state.profile = null; return; }
    const { data, error } = await sb
      .from("profiles")
      .select("id, display_name, role, banned_until, ban_reason")
      .eq("id", state.user.id)
      .maybeSingle();
    if (error) { console.warn("프로필 조회 실패:", error.message); state.profile = null; return; }
    state.profile = data;
  }

  async function init() {
    if (!sb) { state.ready = true; notify(); return state; }
    const { data } = await sb.auth.getSession();
    state.user = data?.session?.user ?? null;
    await loadProfile();
    state.ready = true;
    notify();

    sb.auth.onAuthStateChange(async (_evt, session) => {
      state.user = session?.user ?? null;
      await loadProfile();
      notify();
    });
    return state;
  }

  /* --- 2. 인증 ------------------------------------------------------------
     이메일·비밀번호 방식입니다. (signInGoogle 은 필요해지면 다시 쓸 수 있게 남겨 둡니다)  */
  const need = () => { if (!sb) throw new Error("백엔드가 아직 설정되지 않았습니다."); };

  async function signInGoogle() {
    need();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.href },
    });
    if (error) throw error;
  }

  const KOR_ERR = {
    "Invalid login credentials": "이메일 또는 비밀번호가 맞지 않습니다.",
    "Email not confirmed": "이메일 확인이 필요합니다. 받은 메일함을 확인해 주세요.",
    "User already registered": "이미 가입된 이메일입니다. 로그인해 주세요.",
    "Password should be at least 6 characters": "비밀번호는 6자 이상이어야 합니다.",
    "Unable to validate email address: invalid format": "이메일 형식이 올바르지 않습니다.",
  };
  const kor = (e) => new Error(KOR_ERR[e.message] || e.message);

  async function signInEmail(email, password) {
    need();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw kor(error);
  }

  /* 가입. 이메일 확인이 켜져 있으면 세션 없이 돌아오므로 그 경우를 알려 줍니다. */
  async function signUpEmail(email, password, displayName, extra = {}) {
    need();
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: displayName || email.split("@")[0], ...extra } },
    });
    if (error) throw kor(error);
    return { needsEmailConfirm: !data.session };
  }

  async function resetPassword(email) {
    need();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("pages/login.html", location.origin + ROOT_PATH).href,
    });
    if (error) throw kor(error);
  }
  async function signOut() {
    if (!sb) return;
    await sb.auth.signOut();
    location.reload();
  }

  const isLoggedIn = () => Boolean(state.user);
  const isAdmin    = () => ["admin", "officer"].includes(state.profile?.role);
  const bannedUntil = () => {
    const t = state.profile?.banned_until;
    if (!t) return null;
    const d = new Date(t);
    return d > new Date() ? d : null;
  };
  const isBanned = () => Boolean(bannedUntil());

  /* --- 3. 게시글 ---------------------------------------------------------- */
  const POST_COLS =
    "id, cat, title, body, images, badge, created_at, author_id, author:public_profiles(display_name)";

  async function listPosts({ cat = "", q = "", page = 1, perPage = 12 } = {}) {
    if (!sb) return { rows: [], count: 0 };
    let query = sb.from("posts").select(POST_COLS, { count: "exact" });
    if (cat) query = query.eq("cat", cat);
    if (q)   query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
    const from = (page - 1) * perPage;
    const { data, error, count } = await query
      .order("badge", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) { console.error(error); return { rows: [], count: 0, error }; }
    return { rows: data ?? [], count: count ?? 0 };
  }

  /* 실패( null )와 "글이 없음"( [] )을 구분해서 돌려줍니다.
     안 그러면 접속 오류를 "아직 글이 없습니다"로 잘못 표시하게 됩니다. */
  async function previewPosts(cat, limit) {
    if (!sb) return null;
    const { data, error } = await sb.from("posts")
      .select("id, cat, title, badge, created_at")
      .eq("cat", cat)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return null; }
    return data ?? [];
  }

  async function getPost(id) {
    if (!sb) return null;
    const { data, error } = await sb.from("posts").select(POST_COLS).eq("id", id).maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  }

  async function createPost({ cat, title, body, images }) {
    if (!sb || !state.user) throw new Error("로그인이 필요합니다.");
    if (isBanned()) throw new Error("차단된 계정입니다.");
    const { data, error } = await sb.from("posts")
      .insert({ author_id: state.user.id, cat, title, body, images: images ?? [] })
      .select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function updatePost(id, { title, body, images }) {
    if (!sb) throw new Error("백엔드 미설정");
    const { error } = await sb.from("posts").update({ title, body, images }).eq("id", id);
    if (error) throw error;
  }

  /* 작성자 본인 삭제(숨김). 운영진 삭제는 adminHide / adminDelete 사용 */
  async function deletePost(id) {
    if (!sb) throw new Error("백엔드 미설정");
    const { error } = await sb.from("posts").update({ is_deleted: true }).eq("id", id);
    if (error) throw error;
  }

  /* --- 4. 댓글 ------------------------------------------------------------ */
  async function listComments(postId) {
    if (!sb) return [];
    const { data, error } = await sb.from("comments")
      .select("id, body, created_at, author_id, author:public_profiles(display_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) { console.error(error); return []; }
    return data ?? [];
  }
  async function addComment(postId, body) {
    if (!sb || !state.user) throw new Error("로그인이 필요합니다.");
    if (isBanned()) throw new Error("차단된 계정입니다.");
    const { error } = await sb.from("comments")
      .insert({ post_id: postId, author_id: state.user.id, body });
    if (error) throw error;
  }
  async function deleteComment(id) {
    const { error } = await sb.from("comments").update({ is_deleted: true }).eq("id", id);
    if (error) throw error;
  }

  /* --- 5. 신고 ------------------------------------------------------------ */
  async function report(targetType, targetId, reason) {
    if (!sb || !state.user) throw new Error("로그인이 필요합니다.");
    const { error } = await sb.from("reports").insert({
      target_type: targetType, target_id: targetId,
      reporter_id: state.user.id, reason,
    });
    if (error) {
      if (error.code === "23505") throw new Error("이미 신고하신 글입니다.");
      throw error;
    }
  }

  /* --- 6. 사진 업로드 ------------------------------------------------------ */
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  async function uploadImage(file) {
    if (!sb || !state.user) throw new Error("로그인이 필요합니다.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("사진은 5MB 이하만 올릴 수 있습니다.");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("JPG · PNG · WEBP · GIF 만 가능합니다.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${state.user.id}/${Date.now()}-${Math.round(performance.now())}.${ext}`;
    const { error } = await sb.storage.from("post-images").upload(path, file, { upsert: false });
    if (error) throw error;
    return sb.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  }

  /* --- 7. 운영진이 웹에서 고치는 콘텐츠 (행사 · 후원 · 임원 · 설정) -------- */
  const CONTENT = {
    events:   { table: "events",   order: "date",       asc: true  },
    sponsors: { table: "sponsors", order: "sort_order", asc: true  },
    officers: { table: "officers", order: "sort_order", asc: true  },
  };

  /* 실패는 null, 없음은 [] — 화면에서 구분해서 표시하기 위함 */
  async function listContent(kind) {
    const c = CONTENT[kind];
    if (!sb || !c) return null;
    const { data, error } = await sb.from(c.table).select("*")
      .order(c.order, { ascending: c.asc }).order("id", { ascending: true });
    if (error) { console.error(error); return null; }
    return data ?? [];
  }

  async function getSettings() {
    if (!sb) return null;
    const { data, error } = await sb.from("site_settings").select("key, value");
    if (error) { console.error(error); return null; }
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  }

  /* --- 8. 운영진 ---------------------------------------------------------- */
  const admin = {
    async listReports(status = "open") {
      const { data, error } = await sb.from("reports")
        .select("id, target_type, target_id, reason, status, created_at, reporter:public_profiles!reports_reporter_id_fkey(display_name)")
        .eq("status", status).order("created_at", { ascending: false }).limit(200);
      if (error) { console.error(error); return []; }
      return data ?? [];
    },
    async resolveReport(id, status) {
      const { error } = await sb.from("reports")
        .update({ status, resolved_by: state.user.id, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    async listUsers(q = "") {
      const { data, error } = await sb.rpc("admin_list_users", { p_q: q, p_limit: 200 });
      if (error) throw error;
      return data ?? [];
    },
    async ban(userId, days, reason, purge) {
      const fn = purge ? "admin_ban_and_purge" : "admin_set_ban";
      const { error } = await sb.rpc(fn, { p_target: userId, p_days: days, p_reason: reason || null });
      if (error) throw error;
    },
    async unban(userId) {
      const { error } = await sb.rpc("admin_set_ban", { p_target: userId, p_days: 0, p_reason: null });
      if (error) throw error;
    },
    async hide(kind, id, hide) {
      const { error } = await sb.rpc("admin_hide", { p_kind: kind, p_id: id, p_hide: hide });
      if (error) throw error;
    },
    async setBadge(postId, badge) {
      const { error } = await sb.rpc("admin_set_badge", { p_post: postId, p_badge: badge });
      if (error) throw error;
    },

    /* 행사 · 후원업체 · 임원진 편집 */
    async saveContent(kind, row) {
      const c = CONTENT[kind];
      if (!c) throw new Error("알 수 없는 항목입니다.");
      const { id, ...fields } = row;
      const q = id
        ? sb.from(c.table).update(fields).eq("id", id)
        : sb.from(c.table).insert(fields);
      const { error } = await q;
      if (error) throw error;
    },
    async deleteContent(kind, id) {
      const c = CONTENT[kind];
      if (!c) throw new Error("알 수 없는 항목입니다.");
      const { error } = await sb.from(c.table).delete().eq("id", id);
      if (error) throw error;
    },
    async saveSetting(key, value) {
      const { error } = await sb.from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
  };

  return {
    configured, state, init, onChange: (fn) => listeners.add(fn),
    signInGoogle, signInEmail, signUpEmail, resetPassword,
    signIn: signInGoogle,          // 이전 이름 호환
    signOut, isLoggedIn, isAdmin, isBanned, bannedUntil,
    listPosts, previewPosts, getPost, createPost, updatePost, deletePost,
    listComments, addComment, deleteComment,
    listContent, getSettings,
    report, uploadImage, admin,
  };
})();

window.KGSA_API = KGSA;
window.kgsaEsc = esc;
window.kgsaEscMultiline = escMultiline;
window.kgsaSafeUrl = safeUrl;
