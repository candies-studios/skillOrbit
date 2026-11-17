# Supabase and Vercel setup

Follow these steps once. They take about 20 minutes. You need a free Supabase account and a free Vercel account (sign in to both with GitHub).

> The GitHub Pages site stays a **static preview** with sample data. Accounts, the database, dashboards and the course builder only work on the Vercel deployment, because they need a server.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it `skillorbit`, set a strong database password (save it in a password manager), and choose the **Mumbai (ap-south-1)** region for Indian users.
3. Wait for the project to finish setting up.

## 2. Create the database

Open **SQL Editor → New query**. For each file below, in this exact order, open it on GitHub, copy the entire contents, paste them into the editor and click **Run**. Each one should finish with "Success. No rows returned".

1. `supabase/migrations/20261117000100_foundation.sql`
2. `supabase/migrations/20261117000200_catalog.sql`
3. `supabase/migrations/20261117000300_learning_commerce.sql`
4. `supabase/migrations/20261117000400_admin_rpcs.sql`
5. `supabase/migrations/20261117000500_storage.sql`
6. `supabase/seed.sql` (adds the six categories and default settings)

If a file fails, don't continue. Note the error message and send it to your developer. Running a migration twice gives "already exists" errors; that's harmless, as long as everything ran once.

**Using the Supabase CLI instead (developers):** `npx supabase link --project-ref <ref>`, then `npx supabase db push`, then run `supabase/seed.sql` in the SQL editor.

**Check it worked:** under **Table Editor** you should see 37 tables, and `categories` should have 6 rows. Under **Storage** you should see 4 buckets.

## 3. Configure sign-in

**Authentication → Sign In / Providers → Email:** keep **Email** enabled and **Confirm email** on.

**Authentication → URL Configuration** (fill this in after step 5, once you have your Vercel address):

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/auth/confirm` and `http://localhost:3000/auth/confirm`

**Emails:** Supabase's built-in email sender is for testing only and sends just a few emails per hour. Before launch, set up custom SMTP (for example Resend) under **Authentication → Emails → SMTP Settings**.

## 4. Copy the API keys

Go to **Project Settings → API** (or **API Keys**) and copy:

- **Project URL**, for example `https://abcdxyz.supabase.co` → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key (or the **publishable** key on newer projects) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** copy the `service_role` / secret key anywhere for now. The app doesn't need it yet, and it must never be put in a `NEXT_PUBLIC_` variable.

## 5. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import `candies-studios/skillOrbit`.
2. Before deploying, open **Environment Variables** and add:

   | Name                            | Value                                                                      |
   | ------------------------------- | -------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | your Project URL                                                           |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/publishable key                                                  |
   | `NEXT_PUBLIC_SITE_URL`          | `https://<your-project>.vercel.app` (update it if you add a custom domain) |
   | `NEXT_PUBLIC_SUPPORT_EMAIL`     | optional, shown in the footer and contact page                             |

3. Click **Deploy**. Leave the build settings as they are. The build reads the database, so finish steps 1–2 first.
4. Go back to step 3 and fill in the URL settings with your Vercel address.

> Vercel's free Hobby plan is for non-commercial use. Move to Pro (or another host) before you take real payments.

## 6. Make yourself Super Admin

1. On your Vercel site, click **Create account**, register with your own email, and confirm it from the email you receive.
2. In Supabase **SQL Editor**, run this, replacing the email address:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, r::public.app_role
   from public.profiles, unnest(array['admin', 'super_admin']) as r
   where email = 'you@example.com'
   on conflict (user_id, role) do update set status = 'active';
   ```

3. Log out and back in. You'll now see the **Admin** section in your dashboard.

This SQL step is the only way to create the first super admin. After that, a super admin can make other users admins from **Admin → Users and roles**. Nobody can give themselves a role from the website.

## 7. Add your first course

There are two ways:

- **As the platform** (a course you own, with no instructor revenue share): open **Course builder** in your dashboard, create a draft, and tick "Platform-owned course".
- **As an instructor:** the instructor applies under **Dashboard → Teach**, and you approve them in **Admin → Applications**, setting their revenue share (for example 70%).

Then:

1. **Course builder → Start a new course:** enter a title and category, then create the draft.
2. **Fill in the editor:**
   - Details: subtitle, description, price in ₹ (0 = free), and learning outcomes.
   - Cover image.
   - Curriculum: modules, then lessons. Mark one or two lessons as free previews.
   - Downloadable files on each lesson.
3. **Preview** the course, then click **Submit for review**.
4. **Admin → Courses → In review:** open the course, check the checklist, and choose **Publish**. It appears on the public site straight away.

**Video:** in each lesson you can enter your video provider's private video ID. The course player that plays these videos arrives in Phase 4, so these IDs are stored securely but nothing plays yet.

## 8. Run it on your computer (developers)

```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev
```

## Troubleshooting

| Symptom                                              | Fix                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| The confirmation link says it has expired            | Open the link in the same browser you signed up in, or request a new one. Check that the Redirect URLs include `/auth/confirm`. |
| The Vercel build fails with "Catalogue query failed" | The migrations haven't run, or the URL/key environment variables are wrong.                                                     |
| You don't see Admin after running the SQL            | Log out and in again. Check that the email in the SQL matches your account exactly.                                             |
| An upload fails                                      | Check that the `course-images` and `lesson-resources` buckets exist (migration 5).                                              |
