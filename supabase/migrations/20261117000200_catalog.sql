-- ════════════════════════════════════════════════════════════════════════
-- SkillOrbit · 0200 · Catalog: categories, courses, modules, lessons,
-- resources, quizzes. Course review workflow. Public read views.
-- ════════════════════════════════════════════════════════════════════════

create type public.course_status as enum ('draft', 'in_review', 'published', 'rejected', 'archived');
create type public.course_level as enum ('beginner', 'intermediate', 'advanced');
create type public.lesson_type as enum ('video', 'reading', 'quiz', 'assignment');

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 2 and 80),
  short_name  text not null check (char_length(short_name) between 2 and 24),
  description text not null default '' check (char_length(description) <= 400),
  hue         int not null default 240 check (hue between 0 and 359),
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.courses (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  owner_id               uuid not null references public.profiles (id) on delete restrict,
  is_platform_owned      boolean not null default false,
  title                  text not null check (char_length(title) between 3 and 120),
  subtitle               text not null default '' check (char_length(subtitle) <= 200),
  description            text not null default '' check (char_length(description) <= 10000),
  category_id            uuid references public.categories (id) on delete restrict,
  level                  public.course_level not null default 'beginner',
  language               text not null default 'English' check (char_length(language) <= 40),
  price_minor            bigint not null default 0 check (price_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor > price_minor),
  currency               char(3) not null default 'INR' check (currency in ('INR', 'USD', 'EUR', 'GBP')),
  included_in_membership boolean not null default true,
  outcomes               text[] not null default '{}' check (cardinality(outcomes) <= 12),
  requirements           text[] not null default '{}' check (cardinality(requirements) <= 12),
  audience               text[] not null default '{}' check (cardinality(audience) <= 12),
  cover_image_path       text,
  status                 public.course_status not null default 'draft',
  is_featured            boolean not null default false,
  rejection_reason       text,
  submitted_at           timestamptz,
  reviewed_by            uuid references public.profiles (id) on delete set null,
  reviewed_at            timestamptz,
  published_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index courses_status_idx on public.courses (status, published_at desc);
create index courses_owner_idx on public.courses (owner_id);
create index courses_category_idx on public.courses (category_id) where status = 'published';
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  title      text not null check (char_length(title) between 2 and 120),
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index course_modules_course_idx on public.course_modules (course_id, position);
create trigger course_modules_updated_at before update on public.course_modules
  for each row execute function public.set_updated_at();

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses (id) on delete cascade,
  module_id        uuid not null references public.course_modules (id) on delete cascade,
  title            text not null check (char_length(title) between 2 and 160),
  type             public.lesson_type not null default 'video',
  duration_minutes int not null default 0 check (duration_minutes between 0 and 1440),
  is_preview       boolean not null default false,
  position         int not null default 0,
  -- protected content: never exposed through public views
  body             text check (char_length(body) <= 50000),
  video_provider   text check (char_length(video_provider) <= 40),
  video_asset_id   text check (char_length(video_asset_id) <= 200),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index lessons_module_idx on public.lessons (module_id, position);
create index lessons_course_idx on public.lessons (course_id);
create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

create table public.lesson_resources (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses (id) on delete cascade,
  lesson_id       uuid not null references public.lessons (id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 160),
  storage_path    text not null unique,
  file_size_bytes bigint check (file_size_bytes >= 0),
  mime_type       text,
  created_at      timestamptz not null default now()
);
create index lesson_resources_lesson_idx on public.lesson_resources (lesson_id);

create table public.quizzes (
  id                 uuid primary key default gen_random_uuid(),
  course_id          uuid not null references public.courses (id) on delete cascade,
  lesson_id          uuid not null unique references public.lessons (id) on delete cascade,
  title              text not null,
  pass_mark_percent  int not null default 70 check (pass_mark_percent between 0 and 100),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger quizzes_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id                   uuid primary key default gen_random_uuid(),
  course_id            uuid not null references public.courses (id) on delete cascade,
  quiz_id              uuid not null references public.quizzes (id) on delete cascade,
  prompt               text not null,
  options              jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  correct_option_index int not null check (correct_option_index >= 0),
  explanation          text,
  position             int not null default 0,
  created_at           timestamptz not null default now()
);
create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, position);

-- Child rows must point at the same course as their parent.
create function public.check_course_consistency()
returns trigger language plpgsql set search_path = '' as $$
declare v_course uuid;
begin
  if tg_table_name = 'lessons' then
    select course_id into v_course from public.course_modules where id = new.module_id;
  elsif tg_table_name = 'lesson_resources' then
    select course_id into v_course from public.lessons where id = new.lesson_id;
  elsif tg_table_name = 'quizzes' then
    select course_id into v_course from public.lessons where id = new.lesson_id;
  elsif tg_table_name = 'quiz_questions' then
    select course_id into v_course from public.quizzes where id = new.quiz_id;
  end if;
  if v_course is distinct from new.course_id then
    raise exception 'course_id does not match parent record' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger lessons_consistency before insert or update on public.lessons
  for each row execute function public.check_course_consistency();
create trigger lesson_resources_consistency before insert or update on public.lesson_resources
  for each row execute function public.check_course_consistency();
create trigger quizzes_consistency before insert or update on public.quizzes
  for each row execute function public.check_course_consistency();
create trigger quiz_questions_consistency before insert or update on public.quiz_questions
  for each row execute function public.check_course_consistency();

-- ── Ownership helper ───────────────────────────────────────────────────
create function public.can_manage_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.owner_id = auth.uid() and public.has_role('instructor')
  )
$$;

-- Storage paths are text; this avoids cast errors on malformed paths.
create function public.can_manage_course_path(p_segment text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if p_segment is null or p_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_manage_course(p_segment::uuid);
end $$;

-- ── Course guard: workflow fields only change through RPCs ──────────────
create function public.guard_course_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_client_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.owner_id <> auth.uid() then
      raise exception 'courses are created for yourself' using errcode = 'insufficient_privilege';
    end if;
    if new.status <> 'draft' or new.is_featured or new.published_at is not null
       or new.reviewed_by is not null or new.submitted_at is not null then
      raise exception 'new courses start as drafts' using errcode = 'insufficient_privilege';
    end if;
    if new.is_platform_owned and not public.is_admin() then
      raise exception 'only admins create platform courses' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if new.owner_id <> old.owner_id
     or new.is_platform_owned <> old.is_platform_owned
     or new.status <> old.status
     or new.submitted_at is distinct from old.submitted_at
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.published_at is distinct from old.published_at
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'workflow fields change through review actions only' using errcode = 'insufficient_privilege';
  end if;
  if new.is_featured <> old.is_featured and not public.is_admin() then
    raise exception 'only admins feature courses' using errcode = 'insufficient_privilege';
  end if;
  if old.status = 'in_review' and not public.is_admin() then
    raise exception 'withdraw the course from review before editing' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger courses_guard before insert or update on public.courses
  for each row execute function public.guard_course_write();

-- Instructors can't edit content while a course is in review.
create function public.guard_course_content()
returns trigger language plpgsql set search_path = '' as $$
declare v_status public.course_status; v_course uuid;
begin
  if not public.is_client_request() or public.is_admin() then
    return coalesce(new, old);
  end if;
  v_course := coalesce(new.course_id, old.course_id);
  select status into v_status from public.courses where id = v_course;
  if v_status = 'in_review' then
    raise exception 'withdraw the course from review before editing' using errcode = 'insufficient_privilege';
  end if;
  return coalesce(new, old);
end $$;
create trigger course_modules_content_guard before insert or update or delete on public.course_modules
  for each row execute function public.guard_course_content();
create trigger lessons_content_guard before insert or update or delete on public.lessons
  for each row execute function public.guard_course_content();
create trigger lesson_resources_content_guard before insert or update or delete on public.lesson_resources
  for each row execute function public.guard_course_content();

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.categories       enable row level security;
alter table public.courses          enable row level security;
alter table public.course_modules   enable row level security;
alter table public.lessons          enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.quizzes          enable row level security;
alter table public.quiz_questions   enable row level security;

create policy "categories: public read active" on public.categories
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "categories: admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ownership is checked on the row itself (not via can_manage_course) so the
-- policy also works for rows being inserted in the same statement (RETURNING).
create policy "courses: public read published" on public.courses
  for select to anon, authenticated
  using (status = 'published' or owner_id = auth.uid() or public.is_admin());
create policy "courses: instructors create" on public.courses
  for insert to authenticated
  with check (owner_id = auth.uid() and (public.has_role('instructor') or public.is_admin()));
create policy "courses: managers update" on public.courses
  for update to authenticated
  using ((owner_id = auth.uid() and public.has_role('instructor')) or public.is_admin())
  with check ((owner_id = auth.uid() and public.has_role('instructor')) or public.is_admin());
create policy "courses: delete unpublished drafts" on public.courses
  for delete to authenticated
  using (((owner_id = auth.uid() and public.has_role('instructor')) or public.is_admin())
         and status in ('draft', 'rejected') and published_at is null);

create policy "modules: read published or managed" on public.course_modules
  for select to anon, authenticated using (
    public.can_manage_course(course_id)
    or exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
  );
create policy "modules: managers write" on public.course_modules
  for all to authenticated
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- Full lesson rows (with content) are for managers here; students get access
-- through has_course_access(), added with enrollments in migration 0300.
create policy "lessons: managers all" on public.lessons
  for all to authenticated
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

create policy "resources: managers all" on public.lesson_resources
  for all to authenticated
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

create policy "quizzes: managers all" on public.quizzes
  for all to authenticated
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- Questions include the correct answer: managers only. Learners receive
-- questions without answers through a Phase 4 RPC.
create policy "quiz questions: managers all" on public.quiz_questions
  for all to authenticated
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- ── Public read views (safe columns only, published content only) ──────
-- These run with the view owner's rights so anonymous visitors can read the
-- curriculum outline without being able to read lesson content columns.
create view public.course_curriculum as
  select l.id, l.course_id, l.module_id, m.title as module_title, m.position as module_position,
         l.title, l.type, l.duration_minutes, l.is_preview, l.position
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = l.course_id
  where c.status = 'published';

create view public.public_instructors as
  select p.user_id as id, p.slug, p.display_name, p.headline, p.bio, p.expertise,
         p.location, p.website_url, p.avatar_path, p.is_featured
  from public.instructor_profiles p
  where p.status = 'approved' and p.slug is not null;

grant select on public.course_curriculum, public.public_instructors to anon, authenticated;

-- ── Course workflow RPCs ───────────────────────────────────────────────
create function public.submit_course_for_review(p_course_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.courses;
begin
  select * into c from public.courses where id = p_course_id for update;
  if not found or not public.can_manage_course(p_course_id) then
    raise exception 'course not found' using errcode = 'no_data_found';
  end if;
  if c.status not in ('draft', 'rejected') then
    raise exception 'only drafts or rejected courses can be submitted' using errcode = 'check_violation';
  end if;
  if c.category_id is null or char_length(c.subtitle) < 10 or char_length(c.description) < 50
     or cardinality(c.outcomes) = 0 then
    raise exception 'add a category, subtitle, description and at least one outcome before submitting'
      using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.lessons where course_id = p_course_id) then
    raise exception 'add at least one lesson before submitting' using errcode = 'check_violation';
  end if;

  update public.courses
     set status = 'in_review', submitted_at = now(), rejection_reason = null
   where id = p_course_id;
  perform public.log_audit('course.submitted', 'course', p_course_id::text,
    jsonb_build_object('status', c.status), jsonb_build_object('status', 'in_review'));
end $$;

create function public.withdraw_course_submission(p_course_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'course not found' using errcode = 'no_data_found';
  end if;
  update public.courses set status = 'draft', submitted_at = null
   where id = p_course_id and status = 'in_review';
  if not found then
    raise exception 'course is not in review' using errcode = 'check_violation';
  end if;
  perform public.log_audit('course.withdrawn', 'course', p_course_id::text, null, jsonb_build_object('status', 'draft'));
end $$;

-- Admin decision. p_decision: 'published' | 'rejected' | 'archived' | 'draft' (unpublish)
create function public.admin_set_course_status(p_course_id uuid, p_decision public.course_status, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.courses;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  select * into c from public.courses where id = p_course_id for update;
  if not found then
    raise exception 'course not found' using errcode = 'no_data_found';
  end if;
  if p_decision = 'rejected' and coalesce(trim(p_reason), '') = '' then
    raise exception 'give a reason when rejecting' using errcode = 'check_violation';
  end if;
  if p_decision = 'published' and not exists (select 1 from public.lessons where course_id = p_course_id) then
    raise exception 'a course needs at least one lesson to be published' using errcode = 'check_violation';
  end if;
  if p_decision = 'in_review' then
    raise exception 'use submit_course_for_review' using errcode = 'check_violation';
  end if;

  update public.courses set
    status = p_decision,
    rejection_reason = case when p_decision = 'rejected' then trim(p_reason) else null end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    published_at = case when p_decision = 'published' then coalesce(c.published_at, now()) else c.published_at end
  where id = p_course_id;

  perform public.log_audit('course.status_changed', 'course', p_course_id::text,
    jsonb_build_object('status', c.status),
    jsonb_build_object('status', p_decision, 'reason', p_reason));

  if c.owner_id <> auth.uid() then
    perform public.notify(c.owner_id, 'course_review',
      case p_decision when 'published' then 'Your course is live'
                      when 'rejected' then 'Your course needs changes'
                      else 'Your course status changed' end,
      coalesce(p_reason, c.title), '/instructor/courses/' || c.id);
  end if;
end $$;
