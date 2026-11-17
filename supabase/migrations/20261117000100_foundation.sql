-- ════════════════════════════════════════════════════════════════════════
-- SkillOrbit · 0100 · Foundation: enums, profiles, roles, applications,
-- settings, audit log, notifications, support tickets, helper functions.
--
-- Conventions
--   * uuid primary keys, timestamptz created_at/updated_at
--   * money = bigint minor units + char(3) ISO currency; rates = int basis points
--   * RLS enabled on every table; default deny
--   * security definer functions pin search_path = '' and fully qualify names
-- ════════════════════════════════════════════════════════════════════════

-- ── Enums ───────────────────────────────────────────────────────────────
create type public.app_role as enum ('student', 'instructor', 'affiliate', 'admin', 'super_admin');
create type public.role_status as enum ('active', 'suspended', 'revoked');
create type public.application_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- ── Generic triggers ───────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Blocks UPDATE/DELETE on append-only tables (ledgers, audit log).
create function public.prevent_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only; write a reversing entry instead', tg_table_name
    using errcode = 'insufficient_privilege';
end $$;

-- True when the statement comes straight from an API client (PostgREST
-- roles), false inside security definer functions and for the service role.
create function public.is_client_request()
returns boolean language sql stable set search_path = '' as $$
  select current_user in ('anon', 'authenticated')
$$;

-- ── Profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text check (char_length(full_name) <= 100),
  avatar_path text,
  country     char(2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Roles (multi-role; never mutually exclusive) ───────────────────────
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null,
  status     public.role_status not null default 'active',
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_idx on public.user_roles (user_id) where status = 'active';
create trigger user_roles_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();

-- ── Role helpers (used by RLS) ─────────────────────────────────────────
create function public.has_role(p_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role and status = 'active'
  )
$$;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'super_admin') and status = 'active'
  )
$$;

create function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role('super_admin')
$$;

-- ── Audit log (append-only) ────────────────────────────────────────────
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function public.prevent_mutation();

create function public.log_audit(
  p_action text, p_entity_type text, p_entity_id text,
  p_before jsonb default null, p_after jsonb default null, p_metadata jsonb default '{}'::jsonb
) returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before, after, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, coalesce(p_metadata, '{}'::jsonb));
$$;

-- ── New user bootstrap: profile + student role ─────────────────────────
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100), '')
  );
  insert into public.user_roles (user_id, role, status) values (new.id, 'student', 'active');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile email in sync when a user changes it in Auth.
create function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Clients may edit their own name/avatar/country, never id or email.
create function public.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_client_request() and (new.id <> old.id or new.email <> old.email) then
    raise exception 'id and email cannot be changed here' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ── Instructor applications / profiles ─────────────────────────────────
create table public.instructor_profiles (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  slug              text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name      text not null check (char_length(display_name) between 2 and 80),
  headline          text not null check (char_length(headline) between 2 and 120),
  bio               text not null check (char_length(bio) between 20 and 3000),
  expertise         text[] not null default '{}' check (cardinality(expertise) <= 10),
  location          text check (char_length(location) <= 80),
  website_url       text check (website_url is null or website_url ~* '^https?://'),
  avatar_path       text,
  application_note  text check (char_length(application_note) <= 3000),
  status            public.application_status not null default 'pending',
  revenue_share_bps int check (revenue_share_bps between 0 and 10000),
  is_featured       boolean not null default false,
  reviewed_by       uuid references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index instructor_profiles_status_idx on public.instructor_profiles (status);
create trigger instructor_profiles_updated_at before update on public.instructor_profiles
  for each row execute function public.set_updated_at();

-- ── Affiliate applications / profiles ──────────────────────────────────
create table public.affiliate_profiles (
  user_id                uuid primary key references public.profiles (id) on delete cascade,
  referral_code          text unique check (referral_code ~ '^[A-Z0-9]{6,16}$'),
  promotion_channels     text not null check (char_length(promotion_channels) between 10 and 2000),
  website_url            text check (website_url is null or website_url ~* '^https?://'),
  status                 public.application_status not null default 'pending',
  commission_override_bps int check (commission_override_bps between 0 and 10000),
  terms_accepted_at      timestamptz not null,
  reviewed_by            uuid references public.profiles (id) on delete set null,
  reviewed_at            timestamptz,
  rejection_reason       text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger affiliate_profiles_updated_at before update on public.affiliate_profiles
  for each row execute function public.set_updated_at();

-- Applicants can create and edit their own application text, but never
-- approve themselves or set review/financial fields. Editing a rejected
-- application resubmits it.
create function public.guard_application()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_client_request() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'applications start as pending' using errcode = 'insufficient_privilege';
    end if;
    if tg_table_name = 'instructor_profiles' then
      if new.slug is not null or new.revenue_share_bps is not null or new.is_featured then
        raise exception 'reviewed fields are set by an admin' using errcode = 'insufficient_privilege';
      end if;
    else
      if new.referral_code is not null or new.commission_override_bps is not null then
        raise exception 'reviewed fields are set by an admin' using errcode = 'insufficient_privilege';
      end if;
    end if;
    return new;
  end if;

  -- UPDATE by the applicant
  if new.user_id <> old.user_id
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'reviewed fields are set by an admin' using errcode = 'insufficient_privilege';
  end if;
  if tg_table_name = 'instructor_profiles' then
    if new.slug is distinct from old.slug
       or new.revenue_share_bps is distinct from old.revenue_share_bps
       or new.is_featured is distinct from old.is_featured then
      raise exception 'reviewed fields are set by an admin' using errcode = 'insufficient_privilege';
    end if;
  else
    if new.referral_code is distinct from old.referral_code
       or new.commission_override_bps is distinct from old.commission_override_bps then
      raise exception 'reviewed fields are set by an admin' using errcode = 'insufficient_privilege';
    end if;
  end if;
  if new.status is distinct from old.status then
    -- the only self-service transition: resubmit after rejection
    if not (old.status = 'rejected' and new.status = 'pending') then
      raise exception 'status is set by an admin' using errcode = 'insufficient_privilege';
    end if;
  elsif old.status = 'rejected' then
    new.status := 'pending';
  end if;
  return new;
end $$;

create trigger instructor_profiles_guard before insert or update on public.instructor_profiles
  for each row execute function public.guard_application();
create trigger affiliate_profiles_guard before insert or update on public.affiliate_profiles
  for each row execute function public.guard_application();

-- ── Platform settings ──────────────────────────────────────────────────
create table public.platform_settings (
  key         text primary key check (key ~ '^[a-z][a-z0-9_.]*$'),
  value       jsonb not null,
  description text,
  is_public   boolean not null default false,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- ── Notifications ──────────────────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create function public.guard_notification_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_client_request()
     and (row(new.id, new.user_id, new.type, new.title, new.body, new.link, new.created_at)
          is distinct from row(old.id, old.user_id, old.type, old.title, old.body, old.link, old.created_at)) then
    raise exception 'only read_at can be changed' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger notifications_guard before update on public.notifications
  for each row execute function public.guard_notification_update();

create function public.notify(p_user_id uuid, p_type text, p_title text, p_body text default null, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
$$;

-- ── Support tickets ────────────────────────────────────────────────────
create table public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  name       text not null check (char_length(name) between 2 and 100),
  email      text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  topic      text not null check (topic in ('general', 'course', 'payment', 'instructor', 'affiliate', 'privacy')),
  message    text not null check (char_length(message) between 20 and 5000),
  status     public.ticket_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_status_idx on public.support_tickets (status, created_at desc);
create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.instructor_profiles enable row level security;
alter table public.affiliate_profiles  enable row level security;
alter table public.platform_settings   enable row level security;
alter table public.notifications       enable row level security;
alter table public.support_tickets     enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "roles: read own or admin" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- no client insert/update/delete on user_roles: only admin RPCs change roles

create policy "audit: admin read" on public.audit_logs
  for select to authenticated using (public.is_admin());

create policy "instructor app: read own or admin" on public.instructor_profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "instructor app: create own" on public.instructor_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "instructor app: update own or admin" on public.instructor_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "affiliate app: read own or admin" on public.affiliate_profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "affiliate app: create own" on public.affiliate_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "affiliate app: update own or admin" on public.affiliate_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "settings: public keys readable" on public.platform_settings
  for select to anon, authenticated using (is_public or public.is_admin());
create policy "settings: admin write" on public.platform_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications: mark own read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tickets: anyone can open" on public.support_tickets
  for insert to anon, authenticated
  with check (status = 'open' and admin_note is null and (user_id is null or user_id = auth.uid()));
create policy "tickets: read own or admin" on public.support_tickets
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "tickets: admin update" on public.support_tickets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Internal functions are not callable by API clients.
revoke execute on function public.log_audit(text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
