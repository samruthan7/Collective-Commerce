import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env");
} catch {
  // Variables may already be set by the shell.
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  process.stderr.write("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env\n");
  process.exit(1);
}

const say = (line: string) => process.stdout.write(`${line}\n`);
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const JOINERS = 100;
const run = Date.now().toString(36);

async function main(): Promise<number> {
  let failures = 0;
  const check = (pass: boolean, label: string) => {
    say(`${pass ? "PASS" : "FAIL"}  ${label}`);
    if (!pass) failures += 1;
  };

  const { data: region } = await admin.from("regions").select("id").eq("slug", "chennai").single();
  const { data: category } = await admin
    .from("categories")
    .select("id")
    .eq("slug", "smartphones")
    .single();
  if (!region || !category)
    throw new Error("Region or category missing: run the migrations first.");

  const product = await admin
    .from("products")
    .insert({
      category_id: category.id,
      brand: "Load",
      name: `Load Test ${run}`,
      slug: `load-test-${run}`,
    })
    .select("id")
    .single();
  if (product.error) throw new Error(`product: ${product.error.message}`);
  const variant = await admin
    .from("product_variants")
    .insert({
      product_id: product.data.id,
      sku: `LOAD-${run}`.toUpperCase(),
      label: "Load variant",
      mrp_paise: 100000,
    })
    .select("id")
    .single();
  if (variant.error) throw new Error(`variant: ${variant.error.message}`);
  const variantId = variant.data.id;

  const userIds: string[] = [];
  try {
    say(`Creating ${JOINERS + 1} temporary users...`);
    const total = JOINERS + 1;
    for (let i = 0; i < total; i += 10) {
      const batch = await Promise.all(
        Array.from({ length: Math.min(10, total - i) }, async (_, k) => {
          const { data, error } = await admin.auth.admin.createUser({
            email: `loadtest-${run}-${i + k}@example.com`,
            password: randomUUID(),
            email_confirm: true,
          });
          if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
          return data.user.id;
        }),
      );
      userIds.push(...batch);
    }

    say(`Firing ${JOINERS} joins at once...`);
    const results = await Promise.allSettled(
      userIds.slice(0, JOINERS).map((uid) =>
        admin.rpc("join_or_create_group_as", {
          p_variant_id: variantId,
          p_region_id: region.id,
          p_user_id: uid,
          p_commitment: "interested",
        }),
      ),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled" && !r.value.error).length;
    check(succeeded === JOINERS, `all ${JOINERS} buyers ended up in a group (${succeeded})`);

    const groups = await admin
      .from("groups")
      .select("id, status, member_count, max_members")
      .eq("variant_id", variantId);
    const rows = groups.data ?? [];
    check(rows.length === 2, `exactly 2 groups exist: one full plus its overflow (${rows.length})`);
    check(
      rows.every((g) => g.member_count <= (g.max_members ?? 50)),
      "no group exceeds 50 members",
    );
    check(
      rows.every((g) => g.member_count === 50 && g.status === "full"),
      "both groups hold 50 and are full",
    );

    for (const g of rows) {
      const real = await admin
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", g.id)
        .is("left_at", null);
      check(
        real.count === g.member_count,
        `member_count matches real rows for ${g.id.slice(0, 8)} (${real.count})`,
      );
    }

    say("Double-click test: the same user joins twice at once...");
    const last = userIds[JOINERS];
    const twice = await Promise.all(
      [0, 1].map(() =>
        admin.rpc("join_or_create_group_as", {
          p_variant_id: variantId,
          p_region_id: region.id,
          p_user_id: last,
          p_commitment: "interested",
        }),
      ),
    );
    check(
      twice.filter((r) => !r.error).length === 1,
      "exactly one of two simultaneous joins succeeded",
    );
  } finally {
    say("Cleaning up...");
    await admin.from("groups").delete().eq("variant_id", variantId);
    await Promise.all(userIds.map((id) => admin.auth.admin.deleteUser(id)));
    await admin.from("products").delete().eq("id", product.data.id);
  }
  return failures;
}

main()
  .then((failures) => {
    say(failures === 0 ? "\nAll concurrency checks passed." : `\n${failures} check(s) failed.`);
    process.exitCode = failures === 0 ? 0 : 1;
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `Test could not run: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
