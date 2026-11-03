import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/lib/authActions";
import { isSupabaseConfigured } from "@/lib/supabaseEnv";

export async function AuthMenu() {
  // No keys (for example in CI builds): show nothing instead of failing.
  if (!isSupabaseConfigured()) return null;

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonClasses("ghost")}>
          Log in
        </Link>
        <Link href="/signup" className={buttonClasses("primary")}>
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-48 truncate text-sm text-ink-500 sm:inline">{user.email}</span>
      <form action={signOutAction}>
        <button type="submit" className={buttonClasses("secondary")}>
          Log out
        </button>
      </form>
    </div>
  );
}
