/**
 * Database test harness: runs the real migrations on PGlite (Postgres compiled
 * to WASM) with a minimal stand-in for Supabase's `auth` and `storage`
 * schemas and Supabase's default API grants. Lets us test RLS, triggers and
 * RPCs without Docker or a hosted project.
 *
 * It does not emulate GoTrue or the Storage API — only the database objects
 * that our migrations and policies depend on.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_STUB = readFileSync(join(process.cwd(), "tests", "db", "supabase-stub.sql"), "utf8");

export type Db = PGlite & {
  /** Run `fn` as an API client: anon (null) or an authenticated user id. */
  as<T>(userId: string | null, fn: () => Promise<T>): Promise<T>;
  /** Run as the service role (server code). */
  asService<T>(fn: () => Promise<T>): Promise<T>;
  createUser(email: string, fullName?: string): Promise<string>;
};

export async function createDb(): Promise<Db> {
  const db = new PGlite() as Db;
  await db.exec(SUPABASE_STUB);
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    try {
      await db.exec(readFileSync(join(dir, file), "utf8"));
    } catch (e) {
      throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
    }
  }
  await db.exec(readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8"));

  db.as = async (userId, fn) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${userId ?? ""}', false);`);
    await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
    try {
      return await fn();
    } finally {
      await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
    }
  };
  db.asService = async (fn) => {
    await db.exec("set role service_role");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  };
  db.createUser = async (email, fullName) => {
    const r = await db.query<{ id: string }>(
      "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
      [email, JSON.stringify(fullName ? { full_name: fullName } : {})],
    );
    return r.rows[0]!.id;
  };
  return db;
}

/** Bootstrap the first super admin the same way the setup guide does (SQL editor). */
export async function makeSuperAdmin(db: Db, userId: string) {
  await db.query(
    `insert into public.user_roles (user_id, role) values ($1, 'super_admin'), ($1, 'admin')
     on conflict (user_id, role) do update set status = 'active'`,
    [userId],
  );
}
