-- ════════════════════════════════════════════════════════════════════════
-- SkillOrbit · 0400 · Admin RPCs: application review, role management.
-- Every function checks the caller's role itself and writes an audit entry.
-- ════════════════════════════════════════════════════════════════════════

create function public.slugify(p_text text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create function public.admin_review_instructor(
  p_user_id uuid, p_decision public.application_status,
  p_revenue_share_bps int default null, p_reason text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare a public.instructor_profiles; v_slug text; v_base text; n int := 1;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  if p_decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'decision must be approved, rejected or suspended' using errcode = 'check_violation';
  end if;
  select * into a from public.instructor_profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'application not found' using errcode = 'no_data_found';
  end if;
  if p_decision = 'approved' and (p_revenue_share_bps is null or p_revenue_share_bps not between 0 and 10000) then
    raise exception 'set the instructor revenue share (0–10000 basis points) when approving' using errcode = 'check_violation';
  end if;
  if p_decision in ('rejected', 'suspended') and coalesce(trim(p_reason), '') = '' then
    raise exception 'give a reason' using errcode = 'check_violation';
  end if;

  v_slug := a.slug;
  if p_decision = 'approved' and v_slug is null then
    v_base := nullif(left(public.slugify(a.display_name), 60), '');
    v_base := coalesce(v_base, 'instructor');
    v_slug := v_base;
    while exists (select 1 from public.instructor_profiles where slug = v_slug) loop
      n := n + 1;
      v_slug := v_base || '-' || n;
    end loop;
  end if;

  update public.instructor_profiles set
    status = p_decision,
    slug = v_slug,
    revenue_share_bps = case when p_decision = 'approved' then p_revenue_share_bps else revenue_share_bps end,
    rejection_reason = case when p_decision = 'approved' then null else trim(p_reason) end,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where user_id = p_user_id;

  if p_decision = 'approved' then
    insert into public.user_roles (user_id, role, status, granted_by)
    values (p_user_id, 'instructor', 'active', auth.uid())
    on conflict (user_id, role) do update set status = 'active', granted_by = auth.uid();
  else
    update public.user_roles set status = case when p_decision = 'suspended' then 'suspended'::public.role_status else 'revoked'::public.role_status end
     where user_id = p_user_id and role = 'instructor';
  end if;

  perform public.log_audit('instructor.' || p_decision::text, 'instructor_profile', p_user_id::text,
    jsonb_build_object('status', a.status, 'revenue_share_bps', a.revenue_share_bps),
    jsonb_build_object('status', p_decision, 'revenue_share_bps', p_revenue_share_bps, 'reason', p_reason));
  perform public.notify(p_user_id, 'instructor_application',
    case p_decision when 'approved' then 'Your instructor application was approved'
                    when 'rejected' then 'Your instructor application needs changes'
                    else 'Your instructor access was suspended' end,
    p_reason, '/dashboard/teach');
end $$;

create function public.admin_review_affiliate(
  p_user_id uuid, p_decision public.application_status, p_reason text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare a public.affiliate_profiles; v_code text;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  if p_decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'decision must be approved, rejected or suspended' using errcode = 'check_violation';
  end if;
  select * into a from public.affiliate_profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'application not found' using errcode = 'no_data_found';
  end if;
  if p_decision in ('rejected', 'suspended') and coalesce(trim(p_reason), '') = '' then
    raise exception 'give a reason' using errcode = 'check_violation';
  end if;

  v_code := a.referral_code;
  if p_decision = 'approved' and v_code is null then
    loop
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit when not exists (select 1 from public.affiliate_profiles where referral_code = v_code);
    end loop;
  end if;

  update public.affiliate_profiles set
    status = p_decision,
    referral_code = v_code,
    rejection_reason = case when p_decision = 'approved' then null else trim(p_reason) end,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where user_id = p_user_id;

  if p_decision = 'approved' then
    insert into public.user_roles (user_id, role, status, granted_by)
    values (p_user_id, 'affiliate', 'active', auth.uid())
    on conflict (user_id, role) do update set status = 'active', granted_by = auth.uid();
  else
    update public.user_roles set status = case when p_decision = 'suspended' then 'suspended'::public.role_status else 'revoked'::public.role_status end
     where user_id = p_user_id and role = 'affiliate';
  end if;

  perform public.log_audit('affiliate.' || p_decision::text, 'affiliate_profile', p_user_id::text,
    jsonb_build_object('status', a.status), jsonb_build_object('status', p_decision, 'reason', p_reason));
  perform public.notify(p_user_id, 'affiliate_application',
    case p_decision when 'approved' then 'Your affiliate application was approved'
                    when 'rejected' then 'Your affiliate application was not approved'
                    else 'Your affiliate access was suspended' end,
    p_reason, '/dashboard/affiliate');
end $$;

-- Grant or remove a role. Admin roles can only be managed by a super admin.
-- Instructor/affiliate roles are granted through application review instead.
create function public.admin_set_role(p_user_id uuid, p_role public.app_role, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_before public.role_status;
begin
  if p_role in ('admin', 'super_admin') then
    if not public.is_super_admin() then
      raise exception 'only a super admin can manage admin roles' using errcode = 'insufficient_privilege';
    end if;
  elsif p_role in ('instructor', 'affiliate') then
    raise exception 'use the application review for this role' using errcode = 'check_violation';
  elsif not public.is_admin() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;

  if p_user_id = auth.uid() and p_role in ('admin', 'super_admin') and not p_active then
    raise exception 'you cannot remove your own admin access' using errcode = 'check_violation';
  end if;
  if p_role = 'super_admin' and not p_active
     and (select count(*) from public.user_roles where role = 'super_admin' and status = 'active') <= 1 then
    raise exception 'there must always be at least one super admin' using errcode = 'check_violation';
  end if;

  select status into v_before from public.user_roles where user_id = p_user_id and role = p_role;

  if p_active then
    insert into public.user_roles (user_id, role, status, granted_by)
    values (p_user_id, p_role, 'active', auth.uid())
    on conflict (user_id, role) do update set status = 'active', granted_by = auth.uid();
  else
    update public.user_roles set status = 'revoked' where user_id = p_user_id and role = p_role;
  end if;

  perform public.log_audit(case when p_active then 'role.granted' else 'role.revoked' end,
    'user', p_user_id::text,
    jsonb_build_object('role', p_role, 'status', v_before),
    jsonb_build_object('role', p_role, 'status', case when p_active then 'active' else 'revoked' end));
end $$;

-- Generic audited admin action for simple record edits done from server code.
create function public.admin_log(p_action text, p_entity_type text, p_entity_id text, p_after jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'insufficient_privilege';
  end if;
  if p_action !~ '^[a-z_]+\.[a-z_]+$' then
    raise exception 'invalid action name' using errcode = 'check_violation';
  end if;
  perform public.log_audit(p_action, p_entity_type, p_entity_id, null, p_after);
end $$;

revoke execute on function public.admin_review_instructor(uuid, public.application_status, int, text) from public, anon;
revoke execute on function public.admin_review_affiliate(uuid, public.application_status, text) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.app_role, boolean) from public, anon;
revoke execute on function public.admin_log(text, text, text, jsonb) from public, anon;
revoke execute on function public.admin_set_course_status(uuid, public.course_status, text) from public, anon;
revoke execute on function public.submit_course_for_review(uuid) from public, anon;
revoke execute on function public.withdraw_course_submission(uuid) from public, anon;
revoke execute on function public.enroll_in_free_course(uuid) from public, anon;
grant execute on function public.admin_review_instructor(uuid, public.application_status, int, text) to authenticated;
grant execute on function public.admin_review_affiliate(uuid, public.application_status, text) to authenticated;
grant execute on function public.admin_set_role(uuid, public.app_role, boolean) to authenticated;
grant execute on function public.admin_log(text, text, text, jsonb) to authenticated;
grant execute on function public.admin_set_course_status(uuid, public.course_status, text) to authenticated;
grant execute on function public.submit_course_for_review(uuid) to authenticated;
grant execute on function public.withdraw_course_submission(uuid) to authenticated;
grant execute on function public.enroll_in_free_course(uuid) to authenticated;
