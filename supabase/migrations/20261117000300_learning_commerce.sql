-- ════════════════════════════════════════════════════════════════════════
-- SkillOrbit · 0300 · Learning, commerce, membership, affiliates, payouts.
--
-- Business logic for payments (Phase 5), membership (6), affiliates (7) and
-- instructor settlements (8) is NOT implemented yet. These tables exist so the
-- schema, constraints and RLS are reviewed and tested up front.
--
-- Rules enforced here:
--   * API clients can READ only their own financial rows and can WRITE none.
--     All financial writes happen in server code (service role) or RPCs.
--   * Ledgers are append-only; corrections are reversing entries.
--   * Prices, rates and splits are snapshotted on order items.
-- ════════════════════════════════════════════════════════════════════════

-- ── Enums ───────────────────────────────────────────────────────────────
create type public.enrollment_source as enum ('purchase', 'membership', 'free', 'admin_grant');
create type public.enrollment_status as enum ('active', 'revoked', 'refunded');
create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded');
create type public.order_item_type as enum ('course', 'membership');
create type public.payment_status as enum ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
create type public.refund_status as enum ('pending', 'processed', 'failed');
create type public.discount_type as enum ('percent', 'fixed');
create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum ('pending', 'active', 'cancelled', 'expired', 'past_due', 'suspended');
create type public.commission_status as enum ('pending', 'approved', 'reversed', 'paid');
create type public.payee_type as enum ('affiliate', 'instructor');
create type public.payout_request_status as enum ('requested', 'approved', 'rejected', 'paid', 'cancelled');
create type public.earning_entry_type as enum ('sale', 'refund_reversal', 'chargeback_reversal', 'adjustment');
create type public.earning_status as enum ('pending', 'available', 'paid');

-- Shared currency check, kept as a domain so all money columns agree.
create domain public.currency_code as char(3) check (value in ('INR', 'USD', 'EUR', 'GBP'));

-- ── Membership plans & subscriptions ───────────────────────────────────
create table public.membership_plans (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[a-z0-9_]+$'),
  name              text not null,
  description       text not null default '',
  interval          public.billing_interval not null,
  price_minor       bigint not null check (price_minor > 0),
  currency          public.currency_code not null default 'INR',
  benefits          text[] not null default '{}',
  gateway_plan_id   text unique,
  grace_period_days int not null default 3 check (grace_period_days between 0 and 30),
  is_active         boolean not null default false,
  is_highlighted    boolean not null default false,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger membership_plans_updated_at before update on public.membership_plans
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete restrict,
  plan_id                 uuid not null references public.membership_plans (id) on delete restrict,
  status                  public.subscription_status not null default 'pending',
  gateway                 text not null default 'razorpay',
  gateway_subscription_id text unique,
  price_minor_snapshot    bigint not null check (price_minor_snapshot > 0),
  currency                public.currency_code not null,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  grace_until             timestamptz,
  cancel_at_period_end    boolean not null default false,
  cancelled_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (current_period_end is null or current_period_start is null or current_period_end > current_period_start)
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Entitlement windows granted by verified subscription events.
create table public.membership_access (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  created_at      timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index membership_access_user_idx on public.membership_access (user_id, ends_at);

-- ── Coupons ────────────────────────────────────────────────────────────
create table public.coupons (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description          text,
  discount_type        public.discount_type not null,
  percent_off_bps      int check (percent_off_bps between 1 and 10000),
  amount_off_minor     bigint check (amount_off_minor > 0),
  currency             public.currency_code,
  applies_to_course_id uuid references public.courses (id) on delete cascade,
  max_redemptions      int check (max_redemptions > 0),
  per_user_limit       int not null default 1 check (per_user_limit > 0),
  valid_from           timestamptz not null default now(),
  valid_until          timestamptz,
  is_active            boolean not null default true,
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (
    (discount_type = 'percent' and percent_off_bps is not null and amount_off_minor is null)
    or (discount_type = 'fixed' and amount_off_minor is not null and currency is not null and percent_off_bps is null)
  ),
  check (valid_until is null or valid_until > valid_from)
);
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

-- ── Affiliates: links, clicks, attributions ────────────────────────────
create table public.affiliate_links (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles (user_id) on delete cascade,
  course_id    uuid references public.courses (id) on delete cascade,
  code         text not null unique check (code ~ '^[A-Za-z0-9_-]{4,40}$'),
  label        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index affiliate_links_affiliate_idx on public.affiliate_links (affiliate_id);

create table public.referral_clicks (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles (user_id) on delete cascade,
  link_id      uuid references public.affiliate_links (id) on delete set null,
  course_id    uuid references public.courses (id) on delete set null,
  visitor_id   text not null,
  ip_hash      text,
  user_agent   text,
  landing_path text,
  created_at   timestamptz not null default now()
);
create index referral_clicks_affiliate_idx on public.referral_clicks (affiliate_id, created_at desc);
create index referral_clicks_visitor_idx on public.referral_clicks (visitor_id, created_at desc);

create table public.affiliate_attributions (
  id             uuid primary key default gen_random_uuid(),
  affiliate_id   uuid not null references public.affiliate_profiles (user_id) on delete cascade,
  user_id        uuid references public.profiles (id) on delete set null,
  visitor_id     text not null,
  first_click_id uuid references public.referral_clicks (id) on delete set null,
  last_click_id  uuid references public.referral_clicks (id) on delete set null,
  model          text not null check (model in ('first_click', 'last_click')),
  attributed_at  timestamptz not null default now(),
  expires_at     timestamptz not null,
  check (expires_at > attributed_at)
);
create index affiliate_attributions_affiliate_idx on public.affiliate_attributions (affiliate_id);

-- ── Orders ─────────────────────────────────────────────────────────────
create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete restrict,
  status                  public.order_status not null default 'pending',
  currency                public.currency_code not null,
  subtotal_minor          bigint not null check (subtotal_minor >= 0),
  discount_minor          bigint not null default 0 check (discount_minor >= 0),
  tax_minor               bigint not null default 0 check (tax_minor >= 0),   -- tax-inclusive component
  total_minor             bigint not null check (total_minor >= 0),
  coupon_id               uuid references public.coupons (id) on delete restrict,
  affiliate_attribution_id uuid references public.affiliate_attributions (id) on delete set null,
  gateway                 text not null default 'razorpay',
  gateway_order_id        text unique,
  paid_at                 timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (total_minor = subtotal_minor - discount_minor),
  check (discount_minor <= subtotal_minor),
  check (tax_minor <= total_minor)
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id                           uuid primary key default gen_random_uuid(),
  order_id                     uuid not null references public.orders (id) on delete restrict,
  item_type                    public.order_item_type not null,
  course_id                    uuid references public.courses (id) on delete restrict,
  membership_plan_id           uuid references public.membership_plans (id) on delete restrict,
  title_snapshot               text not null,
  currency                     public.currency_code not null,
  list_price_minor             bigint not null check (list_price_minor >= 0),
  discount_minor               bigint not null default 0 check (discount_minor >= 0),
  net_minor                    bigint not null check (net_minor >= 0),
  tax_minor                    bigint not null default 0 check (tax_minor >= 0),
  instructor_id                uuid references public.profiles (id) on delete restrict,
  instructor_share_bps_snapshot int not null default 0 check (instructor_share_bps_snapshot between 0 and 10000),
  affiliate_rate_bps_snapshot   int not null default 0 check (affiliate_rate_bps_snapshot between 0 and 10000),
  fees_reduce_base_snapshot     boolean not null default true,
  created_at                   timestamptz not null default now(),
  check (net_minor = list_price_minor - discount_minor),
  check (tax_minor <= net_minor),
  check ((item_type = 'course' and course_id is not null and membership_plan_id is null)
      or (item_type = 'membership' and membership_plan_id is not null and course_id is null))
);
create index order_items_order_idx on public.order_items (order_id);
create trigger order_items_append_only before update or delete on public.order_items
  for each row execute function public.prevent_mutation();

-- ── Payments ───────────────────────────────────────────────────────────
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete restrict,
  gateway            text not null default 'razorpay',
  gateway_payment_id text not null,
  amount_minor       bigint not null check (amount_minor > 0),
  currency           public.currency_code not null,
  status             public.payment_status not null,
  method             text,
  fee_minor          bigint check (fee_minor >= 0),
  tax_on_fee_minor   bigint check (tax_on_fee_minor >= 0),
  captured_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (gateway, gateway_payment_id)
);
create index payments_order_idx on public.payments (order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Identity and amount of a payment never change; only status/fee details may.
create function public.guard_payment_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.order_id <> old.order_id or new.gateway <> old.gateway
     or new.gateway_payment_id <> old.gateway_payment_id
     or new.amount_minor <> old.amount_minor or new.currency <> old.currency then
    raise exception 'payment identity and amount are immutable' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger payments_guard before update on public.payments
  for each row execute function public.guard_payment_update();
create trigger payments_no_delete before delete on public.payments
  for each row execute function public.prevent_mutation();

-- Raw gateway webhook events; (gateway, event_id) makes processing idempotent.
create table public.payment_events (
  id               uuid primary key default gen_random_uuid(),
  gateway          text not null,
  event_id         text not null,
  event_type       text not null,
  payload          jsonb not null,
  signature_valid  boolean not null,
  received_at      timestamptz not null default now(),
  processed_at     timestamptz,
  processing_error text,
  unique (gateway, event_id)
);
create trigger payment_events_no_delete before delete on public.payment_events
  for each row execute function public.prevent_mutation();

create table public.refunds (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete restrict,
  payment_id        uuid not null references public.payments (id) on delete restrict,
  order_item_id     uuid references public.order_items (id) on delete restrict,
  gateway_refund_id text unique,
  amount_minor      bigint not null check (amount_minor > 0),
  currency          public.currency_code not null,
  reason            text,
  is_chargeback     boolean not null default false,
  status            public.refund_status not null default 'pending',
  requested_by      uuid references public.profiles (id) on delete set null,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index refunds_order_idx on public.refunds (order_id);
create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

create table public.coupon_redemptions (
  id             uuid primary key default gen_random_uuid(),
  coupon_id      uuid not null references public.coupons (id) on delete restrict,
  order_id       uuid not null unique references public.orders (id) on delete restrict,
  user_id        uuid not null references public.profiles (id) on delete restrict,
  discount_minor bigint not null check (discount_minor >= 0),
  created_at     timestamptz not null default now()
);
create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);
create trigger coupon_redemptions_append_only before update or delete on public.coupon_redemptions
  for each row execute function public.prevent_mutation();

-- ── Learning ───────────────────────────────────────────────────────────
create table public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete restrict,
  source        public.enrollment_source not null,
  order_item_id uuid references public.order_items (id) on delete restrict,
  status        public.enrollment_status not null default 'active',
  enrolled_at   timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (user_id, course_id),
  check (source <> 'purchase' or order_item_id is not null)
);
create index enrollments_course_idx on public.enrollments (course_id);

create table public.lesson_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles (id) on delete cascade,
  course_id             uuid not null references public.courses (id) on delete cascade,
  lesson_id             uuid not null references public.lessons (id) on delete cascade,
  completed_at          timestamptz,
  last_position_seconds int not null default 0 check (last_position_seconds >= 0),
  updated_at            timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index lesson_progress_user_course_idx on public.lesson_progress (user_id, course_id);
create trigger lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

create table public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  answers       jsonb not null,
  score_percent int not null check (score_percent between 0 and 100),
  passed        boolean not null,
  created_at    timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, quiz_id);

create table public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete restrict,
  course_id          uuid not null references public.courses (id) on delete restrict,
  certificate_number text not null unique,
  recipient_name     text not null,
  course_title       text not null,
  storage_path       text,
  issued_at          timestamptz not null default now(),
  revoked_at         timestamptz,
  revoke_reason      text,
  unique (user_id, course_id)
);

-- ── Commissions, payouts, instructor ledger ─────────────────────────────
create table public.payout_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete restrict,
  payee_type       public.payee_type not null,
  amount_minor     bigint not null check (amount_minor > 0),
  currency         public.currency_code not null,
  status           public.payout_request_status not null default 'requested',
  note             text,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index payout_requests_user_idx on public.payout_requests (user_id, created_at desc);
create trigger payout_requests_updated_at before update on public.payout_requests
  for each row execute function public.set_updated_at();

-- Affiliate payouts (manual, admin-approved).
create table public.payouts (
  id                uuid primary key default gen_random_uuid(),
  payout_request_id uuid not null unique references public.payout_requests (id) on delete restrict,
  payee_id          uuid not null references public.profiles (id) on delete restrict,
  amount_minor      bigint not null check (amount_minor > 0),
  currency          public.currency_code not null,
  method            text not null,
  reference         text not null,
  paid_at           timestamptz not null,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);
create trigger payouts_append_only before update or delete on public.payouts
  for each row execute function public.prevent_mutation();

create table public.commissions (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliate_profiles (user_id) on delete restrict,
  order_id        uuid not null references public.orders (id) on delete restrict,
  order_item_id   uuid not null unique references public.order_items (id) on delete restrict, -- no duplicates
  attribution_id  uuid references public.affiliate_attributions (id) on delete set null,
  base_minor      bigint not null check (base_minor >= 0),
  rate_bps        int not null check (rate_bps between 0 and 10000),
  amount_minor    bigint not null check (amount_minor >= 0),
  currency        public.currency_code not null,
  status          public.commission_status not null default 'pending',
  available_at    timestamptz not null,
  reversed_at     timestamptz,
  reversal_reason text,
  payout_id       uuid references public.payouts (id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (amount_minor = (base_minor * rate_bps) / 10000)   -- integer floor
);
create index commissions_affiliate_idx on public.commissions (affiliate_id, status);
create trigger commissions_updated_at before update on public.commissions
  for each row execute function public.set_updated_at();

create function public.guard_commission_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.affiliate_id <> old.affiliate_id or new.order_item_id <> old.order_item_id
     or new.base_minor <> old.base_minor or new.rate_bps <> old.rate_bps
     or new.amount_minor <> old.amount_minor or new.currency <> old.currency then
    raise exception 'commission amounts are immutable' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger commissions_guard before update on public.commissions
  for each row execute function public.guard_commission_update();
create trigger commissions_no_delete before delete on public.commissions
  for each row execute function public.prevent_mutation();

create table public.instructor_payouts (
  id                uuid primary key default gen_random_uuid(),
  instructor_id     uuid not null references public.profiles (id) on delete restrict,
  payout_request_id uuid unique references public.payout_requests (id) on delete restrict,
  amount_minor      bigint not null check (amount_minor > 0),
  currency          public.currency_code not null,
  method            text not null,
  reference         text not null,
  paid_at           timestamptz not null,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);
create trigger instructor_payouts_append_only before update or delete on public.instructor_payouts
  for each row execute function public.prevent_mutation();

-- Signed ledger: sales are positive, reversals negative.
create table public.instructor_earnings (
  id                  uuid primary key default gen_random_uuid(),
  instructor_id       uuid not null references public.profiles (id) on delete restrict,
  order_item_id       uuid not null references public.order_items (id) on delete restrict,
  course_id           uuid not null references public.courses (id) on delete restrict,
  entry_type          public.earning_entry_type not null,
  amount_minor        bigint not null,
  currency            public.currency_code not null,
  share_bps_snapshot  int not null check (share_bps_snapshot between 0 and 10000),
  available_at        timestamptz not null,
  instructor_payout_id uuid references public.instructor_payouts (id) on delete restrict,
  note                text,
  created_at          timestamptz not null default now(),
  check ((entry_type = 'sale' and amount_minor >= 0) or (entry_type in ('refund_reversal', 'chargeback_reversal') and amount_minor <= 0) or entry_type = 'adjustment')
);
create unique index instructor_earnings_one_sale on public.instructor_earnings (order_item_id) where entry_type = 'sale';
create index instructor_earnings_instructor_idx on public.instructor_earnings (instructor_id, created_at desc);
create trigger instructor_earnings_append_only before update or delete on public.instructor_earnings
  for each row execute function public.prevent_mutation();

-- ── Course access (entitlement) ────────────────────────────────────────
create function public.has_active_membership(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membership_access a
    where a.user_id = p_user and now() >= a.starts_at and now() < a.ends_at
  )
$$;

create function public.has_course_access(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.can_manage_course(p_course_id)
    or exists (
      select 1 from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.user_id = auth.uid() and e.course_id = p_course_id and e.status = 'active'
        and c.status in ('published', 'archived')   -- learners keep access to archived courses
    )
    or exists (
      select 1 from public.courses c
      where c.id = p_course_id and c.status = 'published' and c.included_in_membership
        and public.has_active_membership(auth.uid())
    )
$$;

-- Learners read full lessons (content) only when entitled; anyone may read
-- preview lessons of published courses.
create policy "lessons: entitled learners read" on public.lessons
  for select to authenticated using (public.has_course_access(course_id));
create policy "lessons: previews public" on public.lessons
  for select to anon, authenticated using (
    is_preview and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
  );
create policy "resources: entitled learners read" on public.lesson_resources
  for select to authenticated using (public.has_course_access(course_id));
create policy "quizzes: entitled learners read" on public.quizzes
  for select to authenticated using (public.has_course_access(course_id));

-- ── RLS (read own; no client writes on financial tables) ────────────────
alter table public.membership_plans       enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.membership_access      enable row level security;
alter table public.coupons                enable row level security;
alter table public.affiliate_links        enable row level security;
alter table public.referral_clicks        enable row level security;
alter table public.affiliate_attributions enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.payments               enable row level security;
alter table public.payment_events         enable row level security;
alter table public.refunds                enable row level security;
alter table public.coupon_redemptions     enable row level security;
alter table public.enrollments            enable row level security;
alter table public.lesson_progress        enable row level security;
alter table public.quiz_attempts          enable row level security;
alter table public.certificates           enable row level security;
alter table public.payout_requests        enable row level security;
alter table public.payouts                enable row level security;
alter table public.commissions            enable row level security;
alter table public.instructor_payouts     enable row level security;
alter table public.instructor_earnings    enable row level security;

create policy "plans: public read active" on public.membership_plans
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "plans: admin write" on public.membership_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subscriptions: read own or admin" on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "membership access: read own or admin" on public.membership_access
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "coupons: admin all" on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "affiliate links: read own or admin" on public.affiliate_links
  for select to authenticated using (affiliate_id = auth.uid() or public.is_admin());
create policy "referral clicks: read own or admin" on public.referral_clicks
  for select to authenticated using (affiliate_id = auth.uid() or public.is_admin());
create policy "attributions: read own or admin" on public.affiliate_attributions
  for select to authenticated using (affiliate_id = auth.uid() or public.is_admin());

create policy "orders: read own or admin" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "order items: read own or admin" on public.order_items
  for select to authenticated using (
    public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "payments: read own or admin" on public.payments
  for select to authenticated using (
    public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "payment events: admin read" on public.payment_events
  for select to authenticated using (public.is_admin());
create policy "refunds: read own or admin" on public.refunds
  for select to authenticated using (
    public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "coupon redemptions: read own or admin" on public.coupon_redemptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "enrollments: read own, course managers, admin" on public.enrollments
  for select to authenticated using (user_id = auth.uid() or public.can_manage_course(course_id));

create policy "progress: read own" on public.lesson_progress
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "progress: write own when entitled" on public.lesson_progress
  for insert to authenticated with check (user_id = auth.uid() and public.has_course_access(course_id));
create policy "progress: update own when entitled" on public.lesson_progress
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.has_course_access(course_id));

create policy "quiz attempts: read own or admin" on public.quiz_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "certificates: read own or admin" on public.certificates
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "payout requests: read own or admin" on public.payout_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "payouts: read own or admin" on public.payouts
  for select to authenticated using (payee_id = auth.uid() or public.is_admin());
create policy "commissions: read own or admin" on public.commissions
  for select to authenticated using (affiliate_id = auth.uid() or public.is_admin());
create policy "instructor payouts: read own or admin" on public.instructor_payouts
  for select to authenticated using (instructor_id = auth.uid() or public.is_admin());
create policy "instructor earnings: read own or admin" on public.instructor_earnings
  for select to authenticated using (instructor_id = auth.uid() or public.is_admin());

-- Free enrolment: the only learner-initiated enrolment path. Paid courses
-- are enrolled by the verified-payment handler in Phase 5.
create function public.enroll_in_free_course(p_course_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; c public.courses;
begin
  if auth.uid() is null then
    raise exception 'sign in to enrol' using errcode = 'insufficient_privilege';
  end if;
  select * into c from public.courses where id = p_course_id;
  if not found or c.status <> 'published' then
    raise exception 'course not found' using errcode = 'no_data_found';
  end if;
  if c.price_minor <> 0 then
    raise exception 'this course is not free' using errcode = 'insufficient_privilege';
  end if;
  insert into public.enrollments (user_id, course_id, source)
  values (auth.uid(), p_course_id, 'free')
  on conflict (user_id, course_id) do update set status = 'active', revoked_at = null
    where public.enrollments.status = 'revoked' and public.enrollments.source = 'free'
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.enrollments where user_id = auth.uid() and course_id = p_course_id;
  end if;
  return v_id;
end $$;
