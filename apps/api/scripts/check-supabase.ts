import {
  createSupabaseAdmin,
  createSupabasePublic,
  parseSupabaseEnv,
} from "../src/lib/supabaseAdmin.js";

const say = (message: string) => process.stdout.write(`${message}\n`);

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: fall back to variables already set in the terminal.
}

async function main(): Promise<number> {
  const env = parseSupabaseEnv(process.env);
  let failures = 0;

  // 1. The server (secret key) can read the table.
  const admin = createSupabaseAdmin(env);
  const adminResult = await admin.from("profiles").select("id, role", { count: "exact" });
  if (adminResult.error) {
    say(`FAIL  admin read of profiles: ${adminResult.error.message}`);
    failures += 1;
  } else {
    say(`PASS  admin can read profiles (${adminResult.count ?? 0} row(s))`);
  }

  // 2. A logged-out visitor (publishable key) must be refused.
  const visitor = createSupabasePublic(env);
  const visitorResult = await visitor.from("profiles").select("id");
  if (visitorResult.error) {
    say(`PASS  logged-out visitor is refused (${visitorResult.error.message})`);
  } else {
    say("FAIL  logged-out visitor could read profiles: check the migration and RLS");
    failures += 1;
  }
  // 3. A logged-out visitor can read active categories.
  const categories = await visitor.from("categories").select("slug").eq("is_active", true);
  if (categories.error || (categories.data?.length ?? 0) < 2) {
    say(`FAIL  visitor cannot read active categories (${categories.error?.message ?? "too few"})`);
    failures += 1;
  } else {
    say(`PASS  visitor can read ${categories.data?.length ?? 0} active categories`);
  }

  // 4. ...but cannot create one.
  const attempt = await visitor.from("categories").insert({ slug: "zz-test", name: "Test" });
  if (attempt.error) {
    say(`PASS  visitor cannot create a category (${attempt.error.message})`);
  } else {
    say("FAIL  visitor created a category: check the migration and RLS");
    failures += 1;
    await admin.from("categories").delete().eq("slug", "zz-test");
  }
  return failures;
}

main()
  .then((failures) => {
    say(failures === 0 ? "\nAll Supabase checks passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((error: unknown) => {
    say(`ERROR ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
