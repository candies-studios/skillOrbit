import { beforeAll, describe, expect, it } from "vitest";
import { createDb, makeSuperAdmin, type Db } from "./harness";

let db: Db;
let superAdmin: string, admin: string, instr: string, instr2: string, student: string, student2: string;
let catId: string;

const q = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  db.query<T>(sql, params).then((r) => r.rows);

async function rejects(p: Promise<unknown>, pattern?: RegExp) {
  let err: Error | null = null;
  try {
    await p;
  } catch (e) {
    err = e as Error;
  }
  expect(err, "expected the statement to be rejected").not.toBeNull();
  if (pattern) expect(err!.message).toMatch(pattern);
}

async function applyAsInstructor(userId: string, name: string) {
  await db.as(userId, () =>
    q(
      `insert into public.instructor_profiles (user_id, display_name, headline, bio, expertise)
       values ($1, $2, 'Teaches practical skills', 'I have taught digital marketing to small teams for years.', '{SEO}')`,
      [userId, name],
    ),
  );
  await db.as(admin, () => q(`select public.admin_review_instructor($1, 'approved', 7000, null)`, [userId]));
}

async function createCourse(owner: string, slug: string) {
  const [row] = await db.as(owner, () =>
    q<{ id: string }>(
      `insert into public.courses (slug, owner_id, title, subtitle, description, category_id, outcomes, price_minor)
       values ($1, $2, 'Course ' || $1, 'A practical subtitle here', repeat('Practical description. ', 5), $3, '{Do a thing}', 149900)
       returning id`,
      [slug, owner, catId],
    ),
  );
  return row!.id;
}

async function addLesson(owner: string, courseId: string, opts: { preview?: boolean } = {}) {
  return db.as(owner, async () => {
    const [m] = await q<{ id: string }>(
      `insert into public.course_modules (course_id, title, position) values ($1, 'Module one', 0) returning id`,
      [courseId],
    );
    const [l] = await q<{ id: string }>(
      `insert into public.lessons (course_id, module_id, title, type, duration_minutes, is_preview, body, video_asset_id)
       values ($1, $2, 'Lesson one', 'video', 10, $3, 'SECRET BODY', 'secret-video-id') returning id`,
      [courseId, m!.id, opts.preview ?? false],
    );
    return { moduleId: m!.id, lessonId: l!.id };
  });
}

beforeAll(async () => {
  db = await createDb();
  superAdmin = await db.createUser("owner@example.com", "Platform Owner");
  admin = await db.createUser("admin@example.com", "Admin");
  instr = await db.createUser("instr@example.com", "Instructor One");
  instr2 = await db.createUser("instr2@example.com", "Instructor Two");
  student = await db.createUser("student@example.com", "Student One");
  student2 = await db.createUser("student2@example.com", "Student Two");
  await makeSuperAdmin(db, superAdmin);
  await db.as(superAdmin, () => q(`select public.admin_set_role($1, 'admin', true)`, [admin]));
  catId = (await q<{ id: string }>(`select id from public.categories where slug = 'ai'`))[0]!.id;
  await applyAsInstructor(instr, "Instructor One");
  await applyAsInstructor(instr2, "Instructor Two");
});

describe("schema", () => {
  it("has the 37 application tables, all with RLS enabled", async () => {
    const tables = await q<{ relname: string; rls: boolean }>(
      `select c.relname, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    );
    expect(tables).toHaveLength(37);
    expect(tables.filter((t) => !t.rls).map((t) => t.relname)).toEqual([]);
  });
});

describe("authentication bootstrap and roles", () => {
  it("creates a profile and student role on sign-up", async () => {
    const rows = await q<{ full_name: string; role: string }>(
      `select p.full_name, r.role from public.profiles p join public.user_roles r on r.user_id = p.id where p.id = $1`,
      [student],
    );
    expect(rows).toEqual([{ full_name: "Student One", role: "student" }]);
  });

  it("does not let a user assign themselves admin", async () => {
    await rejects(
      db.as(student, () => q(`insert into public.user_roles (user_id, role) values ($1, 'admin')`, [student])),
      /row-level security/,
    );
    await rejects(
      db.as(student, () => q(`select public.admin_set_role($1, 'admin', true)`, [student])),
      /super admin/,
    );
    const roles = await q(`select 1 from public.user_roles where user_id = $1 and role = 'admin'`, [student]);
    expect(roles).toHaveLength(0);
  });

  it("does not let a plain admin grant admin roles; super admin can", async () => {
    await rejects(
      db.as(admin, () => q(`select public.admin_set_role($1, 'admin', true)`, [student])),
      /super admin/,
    );
  });

  it("never removes the last super admin or your own admin access", async () => {
    await rejects(db.as(superAdmin, () => q(`select public.admin_set_role($1, 'super_admin', false)`, [superAdmin])));
  });

  it("users read only their own profile and roles", async () => {
    const profiles = await db.as(student, () => q(`select id from public.profiles`));
    expect(profiles).toEqual([{ id: student }]);
    const roles = await db.as(student, () => q(`select user_id from public.user_roles`));
    expect(new Set(roles.map((r) => r.user_id))).toEqual(new Set([student]));
  });

  it("users cannot change their own email in profiles", async () => {
    await rejects(
      db.as(student, () => q(`update public.profiles set email = 'x@example.com' where id = $1`, [student])),
      /cannot be changed/,
    );
  });
});

describe("instructor applications", () => {
  it("applicants cannot approve themselves or set their revenue share", async () => {
    await db.as(student, () =>
      q(
        `insert into public.instructor_profiles (user_id, display_name, headline, bio) values ($1, 'Student One', 'Teacher', repeat('bio ', 10))`,
        [student],
      ),
    );
    await rejects(
      db.as(student, () =>
        q(`update public.instructor_profiles set status = 'approved' where user_id = $1`, [student]),
      ),
      /admin/,
    );
    await rejects(
      db.as(student, () =>
        q(`update public.instructor_profiles set revenue_share_bps = 10000 where user_id = $1`, [student]),
      ),
      /admin/,
    );
    await rejects(
      db.as(student, () => q(`select public.admin_review_instructor($1, 'approved', 9000, null)`, [student])),
      /admin only/,
    );
    const r = await q(`select 1 from public.user_roles where user_id = $1 and role = 'instructor'`, [student]);
    expect(r).toHaveLength(0);
  });

  it("approval grants the instructor role, a slug and an audit entry", async () => {
    const [p] = await q<{ slug: string; revenue_share_bps: number }>(
      `select slug, revenue_share_bps from public.instructor_profiles where user_id = $1`,
      [instr],
    );
    expect(p).toEqual({ slug: "instructor-one", revenue_share_bps: 7000 });
    const audit = await q(`select 1 from public.audit_logs where action = 'instructor.approved' and entity_id = $1`, [
      instr,
    ]);
    expect(audit).toHaveLength(1);
  });

  it("rejection needs a reason; editing a rejected application resubmits it", async () => {
    await rejects(db.as(admin, () => q(`select public.admin_review_instructor($1, 'rejected', null, '')`, [student])));
    await db.as(admin, () =>
      q(`select public.admin_review_instructor($1, 'rejected', null, 'Add examples of your work')`, [student]),
    );
    await db.as(student, () =>
      q(`update public.instructor_profiles set headline = 'Updated headline' where user_id = $1`, [student]),
    );
    const [p] = await q<{ status: string }>(`select status from public.instructor_profiles where user_id = $1`, [
      student,
    ]);
    expect(p!.status).toBe("pending");
  });

  it("only approved instructors appear publicly", async () => {
    const pub = await db.as(null, () =>
      q<{ slug: string }>(`select slug from public.public_instructors order by slug`),
    );
    expect(pub.map((p) => p.slug)).toEqual(["instructor-one", "instructor-two"]);
    // Applications (with review notes and revenue shares) are never public.
    expect(await db.as(null, () => q(`select * from public.instructor_profiles`))).toHaveLength(0);
    expect(await db.as(student2, () => q(`select * from public.instructor_profiles`))).toHaveLength(0);
  });
});

describe("courses and ownership", () => {
  let courseId: string;
  let lessonId: string;

  it("students cannot create courses", async () => {
    await rejects(createCourse(student, "student-course"), /row-level security/);
  });

  it("instructors create drafts only", async () => {
    courseId = await createCourse(instr, "ai-basics");
    await rejects(
      db.as(instr, () =>
        q(
          `insert into public.courses (slug, owner_id, title, status) values ('sneaky', $1, 'Sneaky publish', 'published')`,
          [instr],
        ),
      ),
      /drafts/,
    );
    ({ lessonId } = await addLesson(instr, courseId));
  });

  it("drafts are invisible to the public and to other instructors", async () => {
    expect(await db.as(null, () => q(`select id from public.courses`))).toHaveLength(0);
    expect(await db.as(instr2, () => q(`select id from public.courses where id = $1`, [courseId]))).toHaveLength(0);
    const upd = await db.as(instr2, () =>
      q(`update public.courses set title = 'Hijacked' where id = $1 returning id`, [courseId]),
    );
    expect(upd).toHaveLength(0);
    await rejects(
      db.as(instr2, () =>
        q(`insert into public.course_modules (course_id, title) values ($1, 'Injected module')`, [courseId]),
      ),
      /row-level security/,
    );
  });

  it("instructors cannot publish or feature their own course", async () => {
    await rejects(
      db.as(instr, () => q(`update public.courses set status = 'published' where id = $1`, [courseId])),
      /review actions/,
    );
    await rejects(
      db.as(instr, () => q(`update public.courses set is_featured = true where id = $1`, [courseId])),
      /admins/,
    );
    await rejects(
      db.as(instr, () => q(`select public.admin_set_course_status($1, 'published', null)`, [courseId])),
      /admin only/,
    );
  });

  it("review workflow: submit → locked → admin publishes → public", async () => {
    await db.as(instr, () => q(`select public.submit_course_for_review($1)`, [courseId]));
    await rejects(
      db.as(instr, () => q(`update public.courses set title = 'Edited in review' where id = $1`, [courseId])),
      /withdraw/,
    );
    await rejects(
      db.as(instr, () => q(`update public.lessons set title = 'Edited in review' where id = $1`, [lessonId])),
      /withdraw/,
    );
    await rejects(db.as(admin, () => q(`select public.admin_set_course_status($1, 'rejected', '')`, [courseId])));
    await db.as(admin, () => q(`select public.admin_set_course_status($1, 'published', null)`, [courseId]));
    const pub = await db.as(null, () => q<{ slug: string }>(`select slug from public.courses`));
    expect(pub.map((c) => c.slug)).toEqual(["ai-basics"]);
    const note = await q(`select 1 from public.notifications where user_id = $1 and type = 'course_review'`, [instr]);
    expect(note).toHaveLength(1);
  });

  it("public sees the curriculum outline but never lesson content", async () => {
    const outline = await db.as(null, () => q<{ title: string }>(`select title from public.course_curriculum`));
    expect(outline.map((o) => o.title)).toEqual(["Lesson one"]);
    expect(await db.as(null, () => q(`select body from public.lessons`))).toHaveLength(0);
    expect(await db.as(student, () => q(`select body from public.lessons`))).toHaveLength(0);
    await rejects(
      db.as(null, () => q(`select body from public.course_curriculum`)),
      /column "body"/,
    );
  });

  it("preview lessons are readable by anyone once published", async () => {
    const { lessonId: previewId } = await db.as(admin, async () => {
      const [m] = await q<{ id: string }>(`select id from public.course_modules where course_id = $1`, [courseId]);
      const [l] = await q<{ id: string }>(
        `insert into public.lessons (course_id, module_id, title, is_preview, body) values ($1, $2, 'Free preview', true, 'preview body') returning id`,
        [courseId, m!.id],
      );
      return { lessonId: l!.id };
    });
    const rows = await db.as(null, () =>
      q<{ body: string }>(`select body from public.lessons where id = $1`, [previewId]),
    );
    expect(rows).toEqual([{ body: "preview body" }]);
  });

  it("only free published courses can be self-enrolled; enrolment grants access", async () => {
    await rejects(
      db.as(student, () => q(`select public.enroll_in_free_course($1)`, [courseId])),
      /not free/,
    );
    await rejects(
      db.as(student, () =>
        q(`insert into public.enrollments (user_id, course_id, source) values ($1, $2, 'free')`, [student, courseId]),
      ),
      /row-level security/,
    );
    const freeId = await createCourse(instr, "free-course");
    await db.as(instr, () => q(`update public.courses set price_minor = 0 where id = $1`, [freeId]));
    await addLesson(instr, freeId);
    await db.as(instr, () => q(`select public.submit_course_for_review($1)`, [freeId]));
    await db.as(admin, () => q(`select public.admin_set_course_status($1, 'published', null)`, [freeId]));
    await db.as(student, () => q(`select public.enroll_in_free_course($1)`, [freeId]));
    await db.as(student, () => q(`select public.enroll_in_free_course($1)`, [freeId])); // idempotent
    const content = await db.as(student, () =>
      q<{ body: string }>(`select body from public.lessons where course_id = $1`, [freeId]),
    );
    expect(content).toEqual([{ body: "SECRET BODY" }]);
    expect(
      await db.as(student2, () => q(`select body from public.lessons where course_id = $1`, [freeId])),
    ).toHaveLength(0);
    expect(await db.as(student2, () => q(`select * from public.enrollments`))).toHaveLength(0);
  });

  it("instructors see enrolments of their own courses only", async () => {
    expect(await db.as(instr, () => q(`select * from public.enrollments`))).toHaveLength(1);
    expect(await db.as(instr2, () => q(`select * from public.enrollments`))).toHaveLength(0);
  });

  it("published courses cannot be deleted; unpublished drafts can", async () => {
    const del = await db.as(instr, () => q(`delete from public.courses where id = $1 returning id`, [courseId]));
    expect(del).toHaveLength(0);
    const draft = await createCourse(instr, "throwaway");
    const del2 = await db.as(instr, () => q(`delete from public.courses where id = $1 returning id`, [draft]));
    expect(del2).toHaveLength(1);
  });

  it("quiz answers are hidden from learners", async () => {
    const [{ id: lid }] = await q<{ id: string }>(
      `select id from public.lessons where course_id = (select id from public.courses where slug='free-course')`,
    );
    await db.as(instr, async () => {
      const [qz] = await q<{ id: string }>(
        `insert into public.quizzes (course_id, lesson_id, title) values ((select course_id from public.lessons where id = $1), $1, 'Quiz') returning id`,
        [lid],
      );
      await q(
        `insert into public.quiz_questions (course_id, quiz_id, prompt, options, correct_option_index)
         values ((select course_id from public.quizzes where id = $1), $1, 'Q?', '["a","b"]', 1)`,
        [qz!.id],
      );
    });
    expect(await db.as(student, () => q(`select correct_option_index from public.quiz_questions`))).toHaveLength(0);
  });
});

describe("financial and affiliate privacy", () => {
  let orderId: string;

  beforeAll(async () => {
    const [course] = await q<{ id: string }>(`select id from public.courses where slug = 'ai-basics'`);
    await db.asService(async () => {
      const [o] = await q<{ id: string }>(
        `insert into public.orders (user_id, currency, subtotal_minor, total_minor) values ($1, 'INR', 149900, 149900) returning id`,
        [student],
      );
      orderId = o!.id;
      const [item] = await q<{ id: string }>(
        `insert into public.order_items (order_id, item_type, course_id, title_snapshot, currency, list_price_minor, net_minor, instructor_id, instructor_share_bps_snapshot)
         values ($1, 'course', $2, 'AI basics', 'INR', 149900, 149900, $3, 7000) returning id`,
        [orderId, course!.id, instr],
      );
      for (const aff of [student, student2]) {
        await q(
          `insert into public.affiliate_profiles (user_id, promotion_channels, terms_accepted_at, status) values ($1, 'My newsletter about AI', now(), 'approved')
           on conflict do nothing`,
          [aff],
        );
      }
      await q(
        `insert into public.commissions (affiliate_id, order_id, order_item_id, base_minor, rate_bps, amount_minor, currency, available_at)
         values ($1, $2, $3, 100000, 2000, 20000, 'INR', now())`,
        [student2, orderId, item!.id],
      );
    });
  });

  it("clients cannot write orders, payments or enrolments", async () => {
    await rejects(
      db.as(student, () =>
        q(`insert into public.orders (user_id, currency, subtotal_minor, total_minor) values ($1, 'INR', 1, 1)`, [
          student,
        ]),
      ),
      /row-level security/,
    );
    const upd = await db.as(student, () =>
      q(`update public.orders set total_minor = 0, subtotal_minor = 0 where id = $1 returning id`, [orderId]),
    );
    expect(upd).toHaveLength(0);
  });

  it("buyers read their own orders only", async () => {
    expect(await db.as(student, () => q(`select id from public.orders`))).toHaveLength(1);
    expect(await db.as(student2, () => q(`select id from public.orders`))).toHaveLength(0);
  });

  it("affiliates read only their own commissions", async () => {
    expect(await db.as(student2, () => q(`select id from public.commissions`))).toHaveLength(1);
    expect(await db.as(student, () => q(`select id from public.commissions`))).toHaveLength(0);
    expect(await db.as(instr, () => q(`select id from public.commissions`))).toHaveLength(0);
  });

  it("commission amounts must equal floor(base × rate) and can't be edited or duplicated", async () => {
    const [item] = await q<{ id: string }>(`select id from public.order_items limit 1`);
    await rejects(
      db.asService(() =>
        q(
          `insert into public.commissions (affiliate_id, order_id, order_item_id, base_minor, rate_bps, amount_minor, currency, available_at)
           values ($1, $2, $3, 100000, 2000, 20000, 'INR', now())`,
          [student, orderId, item!.id],
        ),
      ),
      /duplicate key/,
    );
    await rejects(
      db.asService(() => q(`update public.commissions set amount_minor = 99999`)),
      /immutable/,
    );
  });

  it("order items and audit logs are append-only, even for the service role", async () => {
    await rejects(
      db.asService(() => q(`update public.order_items set list_price_minor = 1`)),
      /append-only/,
    );
    await rejects(
      db.asService(() => q(`delete from public.audit_logs`)),
      /append-only/,
    );
  });

  it("order totals must reconcile", async () => {
    await rejects(
      db.asService(() =>
        q(
          `insert into public.orders (user_id, currency, subtotal_minor, discount_minor, total_minor) values ($1, 'INR', 1000, 100, 1000)`,
          [student],
        ),
      ),
      /check constraint/,
    );
  });

  it("only admins read the audit log", async () => {
    expect(await db.as(student, () => q(`select id from public.audit_logs`))).toHaveLength(0);
    expect((await db.as(admin, () => q(`select id from public.audit_logs`))).length).toBeGreaterThan(0);
  });
});

describe("support tickets", () => {
  it("anyone can open a ticket but only its owner or an admin can read it", async () => {
    await db.as(null, () =>
      q(
        `insert into public.support_tickets (name, email, topic, message) values ('Guest', 'g@example.com', 'general', 'I have a question about courses please.')`,
      ),
    );
    expect(await db.as(null, () => q(`select id from public.support_tickets`))).toHaveLength(0);
    expect(await db.as(student, () => q(`select id from public.support_tickets`))).toHaveLength(0);
    expect(await db.as(admin, () => q(`select id from public.support_tickets`))).toHaveLength(1);
    await rejects(
      db.as(null, () =>
        q(
          `insert into public.support_tickets (name, email, topic, message, status) values ('G', 'g@example.com', 'general', 'Trying to set a status directly here', 'resolved')`,
        ),
      ),
      /row-level security/,
    );
  });
});

describe("storage policies", () => {
  it("instructors upload only into their own course folders", async () => {
    const [c] = await q<{ id: string }>(`select id from public.courses where slug = 'ai-basics'`);
    const own = `${c!.id}/cover.jpg`;
    await db.as(instr, () => q(`insert into storage.objects (bucket_id, name) values ('course-images', $1)`, [own]));
    await rejects(
      db.as(instr2, () =>
        q(`insert into storage.objects (bucket_id, name) values ('course-images', $1)`, [`${c!.id}/x.jpg`]),
      ),
      /row-level security/,
    );
    await rejects(
      db.as(instr2, () =>
        q(`insert into storage.objects (bucket_id, name) values ('course-images', 'not-a-uuid/x.jpg')`),
      ),
      /row-level security/,
    );
  });

  it("private lesson resources are readable only by entitled users", async () => {
    const [c] = await q<{ id: string }>(`select id from public.courses where slug = 'free-course'`);
    const path = `${c!.id}/lesson/notes.pdf`;
    await db.as(instr, () =>
      q(`insert into storage.objects (bucket_id, name) values ('lesson-resources', $1)`, [path]),
    );
    expect(
      await db.as(student, () => q(`select name from storage.objects where bucket_id = 'lesson-resources'`)),
    ).toHaveLength(1);
    expect(
      await db.as(student2, () => q(`select name from storage.objects where bucket_id = 'lesson-resources'`)),
    ).toHaveLength(0);
    expect(
      await db.as(null, () => q(`select name from storage.objects where bucket_id = 'lesson-resources'`)),
    ).toHaveLength(0);
  });
});
