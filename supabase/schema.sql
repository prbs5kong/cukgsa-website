-- ============================================================================
--  CU Boulder KGSA — Supabase 데이터베이스 스키마
--
--  사용법: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 RUN
--  여러 번 실행해도 안전합니다 (idempotent).
--
--  ★ 중요: 브라우저에는 anon key 가 그대로 노출됩니다.
--    데이터를 지키는 건 오직 아래의 RLS 정책입니다. 함부로 끄지 마세요.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. 프로필 (auth.users 확장)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text not null default '이름 없음',
  avatar_url    text,
  role          text not null default 'member' check (role in ('member','officer','admin')),
  banned_until  timestamptz,          -- null 이면 정상, 미래 시각이면 차단 중
  ban_reason    text,
  created_at    timestamptz not null default now()
);

-- 가입 신청서에서 받은 추가 정보
alter table public.profiles add column if not exists status      text not null default '';
alter table public.profiles add column if not exists dept        text not null default '';
alter table public.profiles add column if not exists year_joined text not null default '';
alter table public.profiles add column if not exists note        text not null default '';
-- display_name = 닉네임 (게시판에 공개). real_name = 실명 (운영진만 조회, 회원 관리용).
alter table public.profiles add column if not exists real_name   text not null default '';

-- 로그인 최초 1회에 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url,
                               status, dept, year_joined, note, real_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(coalesce(new.email,'user@x'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'status', ''),
    coalesce(new.raw_user_meta_data->>'dept', ''),
    coalesce(new.raw_user_meta_data->>'year_joined', ''),
    coalesce(new.raw_user_meta_data->>'note', ''),
    coalesce(new.raw_user_meta_data->>'real_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. 권한 판별 함수
--    security definer = RLS 를 우회해서 조회 (안 그러면 무한 재귀)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','officer')
  );
$$;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and banned_until is not null
      and banned_until > now()
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. 게시글 / 댓글 / 신고
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  cat         text not null check (cat in ('notice','career','market','housing','community')),
  title       text not null check (char_length(title) between 1 and 150),
  body        text not null default '' check (char_length(body) <= 20000),
  images      text[] not null default '{}' check (array_length(images,1) is null or array_length(images,1) <= 8),
  badge       text check (badge in ('pin','new','hot')),
  is_deleted  boolean not null default false,   -- 작성자 본인 삭제
  hidden_by_admin boolean not null default false, -- 운영진 조치 (작성자가 되돌릴 수 없음)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_cat_created_idx on public.posts (cat, created_at desc);
create index if not exists posts_created_idx     on public.posts (created_at desc);

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  is_deleted  boolean not null default false,
  hidden_by_admin boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  target_type  text not null check (target_type in ('post','comment')),
  target_id    bigint not null,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  reason       text not null check (char_length(reason) between 1 and 500),
  status       text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at   timestamptz not null default now(),
  resolved_by  uuid references public.profiles(id),
  resolved_at  timestamptz,
  unique (target_type, target_id, reporter_id)   -- 같은 글 중복 신고 방지
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- 수정 시각 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 4. 작성자 이름을 공개하기 위한 뷰
--    profiles 를 통째로 공개하면 전 회원 이메일이 새어 나갑니다.
--    공개해도 되는 칼럼만 뽑은 뷰를 따로 둡니다.
-- ────────────────────────────────────────────────────────────────────────────
create or replace view public.public_profiles
with (security_invoker = off) as
  select id, display_name, avatar_url, role from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. RLS 활성화
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.reports  enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ★ 스스로 admin 으로 승격하거나 차단을 푸는 것을 막습니다.
--   RLS 는 '행'만 막으므로 '칼럼'은 GRANT 로 막아야 합니다.
revoke all on public.profiles from authenticated, anon;
grant select on public.profiles to authenticated;
grant update (display_name, real_name) on public.profiles to authenticated;

-- posts ---------------------------------------------------------------------
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select
  using ((is_deleted = false and hidden_by_admin = false) or public.is_admin());

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and not public.is_banned()
    -- 공지사항·취업인턴은 운영진만 (화면에서 막아도 API로 우회할 수 있으므로 여기서 강제)
    and (cat not in ('notice','career') or public.is_admin())
  );

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using ((author_id = auth.uid() and not public.is_banned()) or public.is_admin())
  with check (
    ((author_id = auth.uid() and not public.is_banned()) or public.is_admin())
    and (cat not in ('notice','career') or public.is_admin())
  );

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated
  using (public.is_admin());

revoke all on public.posts from authenticated, anon;
grant select on public.posts to anon, authenticated;
grant insert (author_id, cat, title, body, images) on public.posts to authenticated;
grant update (title, body, images, is_deleted)     on public.posts to authenticated;
-- ↑ hidden_by_admin 은 일부러 제외했습니다. 운영진이 숨긴 글을 작성자가 되살릴 수 없게 합니다.
grant delete on public.posts to authenticated;   -- 실제 허용은 위 RLS 가 admin 으로 제한

-- comments ------------------------------------------------------------------
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select
  using ((is_deleted = false and hidden_by_admin = false) or public.is_admin());

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid() and not public.is_banned());

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated
  using ((author_id = auth.uid() and not public.is_banned()) or public.is_admin())
  with check ((author_id = auth.uid() and not public.is_banned()) or public.is_admin());

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (public.is_admin());

revoke all on public.comments from authenticated, anon;
grant select on public.comments to anon, authenticated;
grant insert (post_id, author_id, body) on public.comments to authenticated;
grant update (body, is_deleted)         on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- reports -------------------------------------------------------------------
-- 신고 내용은 운영진만 봅니다. (신고자 보호)
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
  using (public.is_admin());

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and not public.is_banned());

drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.reports from authenticated, anon;
grant select on public.reports to authenticated;
grant insert (target_type, target_id, reporter_id, reason) on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. 운영진 전용 동작 (RPC)
--    칼럼 GRANT 로 막아둔 것들은 이 함수를 통해서만 바뀝니다.
--    함수 안에서 is_admin() 을 다시 확인하므로 회원이 직접 불러도 거부됩니다.
-- ────────────────────────────────────────────────────────────────────────────

-- 계정 차단 / 해제.  days 가 null 이면 영구 차단, 0 이면 차단 해제.
create or replace function public.admin_set_ban(p_target uuid, p_days int, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;
  if p_target = auth.uid() then
    raise exception '본인 계정은 차단할 수 없습니다.';
  end if;
  if exists (select 1 from public.profiles where id = p_target and role = 'admin') then
    raise exception '관리자 계정은 차단할 수 없습니다.';
  end if;

  if p_days = 0 then
    update public.profiles set banned_until = null, ban_reason = null where id = p_target;
  else
    update public.profiles
       set banned_until = case when p_days is null then 'infinity'::timestamptz
                               else now() + (p_days || ' days')::interval end,
           ban_reason   = p_reason
     where id = p_target;
  end if;
end $$;

-- 차단과 동시에 그 계정의 글·댓글을 전부 숨깁니다 (스팸 대량 등록 대응)
create or replace function public.admin_ban_and_purge(p_target uuid, p_days int, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_set_ban(p_target, p_days, p_reason);
  update public.posts    set hidden_by_admin = true where author_id = p_target;
  update public.comments set hidden_by_admin = true where author_id = p_target;
end $$;

-- 글/댓글 하나만 숨기거나 되살리기
create or replace function public.admin_hide(p_kind text, p_id bigint, p_hide boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '권한이 없습니다.'; end if;
  if p_kind = 'post' then
    update public.posts    set hidden_by_admin = p_hide where id = p_id;
  elsif p_kind = 'comment' then
    update public.comments set hidden_by_admin = p_hide where id = p_id;
  else
    raise exception '잘못된 대상입니다.';
  end if;
end $$;

-- 공지 고정 / 배지 (회원은 badge 칼럼을 아예 쓸 수 없습니다)
create or replace function public.admin_set_badge(p_post bigint, p_badge text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '권한이 없습니다.'; end if;
  if p_badge is not null and p_badge not in ('pin','new','hot') then
    raise exception '잘못된 배지 값입니다.';
  end if;
  update public.posts set badge = p_badge where id = p_post;
end $$;

-- 관리자 화면용 회원 목록 (이메일 포함이라 admin 만)
create or replace function public.admin_list_users(p_q text default null, p_limit int default 100)
returns table (
  id uuid, email text, display_name text, real_name text, role text,
  banned_until timestamptz, ban_reason text, created_at timestamptz,
  dept text, status text,
  post_count bigint, report_count bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.display_name, p.real_name, p.role, p.banned_until, p.ban_reason, p.created_at,
         p.dept, p.status,
         (select count(*) from public.posts   x where x.author_id = p.id and x.is_deleted = false),
         (select count(*) from public.reports r
            where r.target_id in (select id from public.posts where author_id = p.id)
              and r.target_type = 'post')
    from public.profiles p
   where public.is_admin()
     and (p_q is null or p_q = ''
          or p.display_name ilike '%'||p_q||'%'
          or p.real_name ilike '%'||p_q||'%'
          or p.email ilike '%'||p_q||'%')
   order by p.created_at desc
   limit least(coalesce(p_limit,100), 500);
$$;

grant execute on function public.admin_set_ban(uuid,int,text)        to authenticated;
grant execute on function public.admin_ban_and_purge(uuid,int,text)  to authenticated;
grant execute on function public.admin_hide(text,bigint,boolean)     to authenticated;
grant execute on function public.admin_set_badge(bigint,text)        to authenticated;
grant execute on function public.admin_list_users(text,int)          to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. 사진 저장소
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images','post-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists post_images_read   on storage.objects;
create policy post_images_read on storage.objects for select
  using (bucket_id = 'post-images');

-- 본인 폴더(uuid/)에만 업로드 가능 · 차단된 계정은 불가
drop policy if exists post_images_upload on storage.objects;
create policy post_images_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_banned()
  );

drop policy if exists post_images_delete on storage.objects;
create policy post_images_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================================
--  ★ 마지막 단계 — 첫 관리자 지정
--
--  1) 위까지 RUN 한 뒤, 홈페이지에서 본인 구글 계정으로 한 번 로그인하세요.
--  2) 그 다음 아래 한 줄의 이메일을 본인 것으로 바꿔서 실행하세요.
--
--      update public.profiles set role = 'admin' where email = '본인@gmail.com';
--
--  확인:  select email, role from public.profiles;
-- ============================================================================

-- ============================================================================
--  8. 운영진이 웹에서 직접 고치는 콘텐츠
--     행사 · 후원업체 · 임원진 · 사이트 설정
--     (여기 있는 것은 파일을 고치거나 사이트를 다시 올릴 필요가 없습니다)
-- ============================================================================

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  date       date not null,
  title      text not null check (char_length(title) between 1 and 150),
  descr      text not null default '' check (char_length(descr) <= 500),
  location   text not null default '',
  time_text  text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 100),
  category   text not null default '',
  initials   text not null default '' check (char_length(initials) <= 4),
  phone      text not null default '',
  area       text not null default '',
  logo_url   text not null default '',
  url        text not null default '#',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sponsors add column if not exists phone    text not null default '';
alter table public.sponsors add column if not exists area     text not null default '';
alter table public.sponsors add column if not exists logo_url text not null default '';

create table if not exists public.officers (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 60),
  role       text not null default '',
  dept       text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- 연락처·SNS 같은 자잘한 값
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.events        enable row level security;
alter table public.sponsors      enable row level security;
alter table public.officers      enable row level security;
alter table public.site_settings enable row level security;

-- 누구나 읽고, 운영진만 씁니다.
do $$
declare t text;
begin
  foreach t in array array['events','sponsors','officers','site_settings'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);

    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all to authenticated
                      using (public.is_admin()) with check (public.is_admin())$f$, t, t);

    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to authenticated;

-- ── 최초 1회만 들어가는 실제 데이터 ──────────────────────────────────────
insert into public.events (date, title, descr, location, time_text, sort_order)
select '2026-08-28', '2026 정기 총회 (Annual Meeting)',
       '회칙에 따른 연 1회 정기 총회입니다. 임원 선출과 한 해 활동 계획을 함께 정합니다. 회원 누구나 참석·투표할 수 있습니다.',
       '장소 추후 공지', '', 0
where not exists (select 1 from public.events);

insert into public.officers (name, role, dept, sort_order)
select * from (values
  ('류승걸', 'President',      'Aerospace Engineering and Sciences', 0),
  ('오원석', 'Vice-President', 'Electrical and Computer Engineering', 1)
) as v(name, role, dept, sort_order)
where not exists (select 1 from public.officers);

insert into public.site_settings (key, value) values
  ('contact_email', 'kgsa@colorado.edu'),
  ('instagram_url', 'https://www.instagram.com/kgsa_cuboulder/'),
  ('facebook_url',  ''),
  ('kakao_url',     ''),
  ('naver_url',     '')
on conflict (key) do nothing;

-- 후원업체는 실제 계약한 곳만 운영 화면에서 추가하세요. (비워 둡니다)
