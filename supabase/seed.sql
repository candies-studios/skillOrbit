-- ════════════════════════════════════════════════════════════════════════
-- Base data. Safe to run in production: categories from the product brief
-- and default platform settings. No courses, users, prices or testimonials.
-- ════════════════════════════════════════════════════════════════════════

insert into public.categories (slug, name, short_name, description, hue, sort_order) values
  ('ai', 'AI and Artificial Intelligence', 'AI',
   'Use AI tools in real work: prompting, automation, research and building simple AI-assisted workflows.', 248, 1),
  ('digital-marketing', 'Digital Marketing', 'Marketing',
   'Search, social, email and paid ads — plan campaigns, measure them and improve what works.', 205, 2),
  ('freelancing', 'Freelancing and Digital Services', 'Freelancing',
   'Package a skill into a service, find clients, price your work and deliver it professionally.', 168, 3),
  ('online-business', 'Online Business and E-commerce', 'E-commerce',
   'Launch and run an online store or digital product business, from sourcing to payments to fulfilment.', 32, 4),
  ('content-creation', 'Content Creation', 'Content',
   'Write, film and edit content people want to follow, and build a repeatable publishing system.', 330, 5),
  ('business-finance', 'Business and Finance Skills', 'Business',
   'Bookkeeping, pricing, GST basics, spreadsheets and the numbers every small business needs.', 280, 6)
on conflict (slug) do nothing;

-- Defaults read by later phases. Admins change these in Platform settings.
insert into public.platform_settings (key, value, description, is_public) values
  ('instructor.default_revenue_share_bps', '7000', 'Suggested instructor share when approving (70%).', false),
  ('affiliate.default_commission_bps', '2000', 'Default affiliate commission (20% of the distributable amount).', false),
  ('affiliate.attribution_window_days', '30', 'Days a referral click stays eligible.', false),
  ('affiliate.attribution_model', '"last_click"', 'first_click or last_click.', false),
  ('ledger.holding_period_days', '30', 'Days before commissions and earnings become payable.', false),
  ('ledger.fees_reduce_base', 'true', 'Whether gateway fees are deducted before revenue shares.', false),
  ('tax.prices_include_tax', 'true', 'Whether list prices include GST. Confirm with a CA.', false),
  ('membership.grace_period_days', '3', 'Days of access after a failed renewal.', false)
on conflict (key) do nothing;
