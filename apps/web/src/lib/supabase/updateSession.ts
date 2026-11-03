import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, type SupabaseEnv } from "@/lib/supabaseEnv";

/** Refreshes the login session cookie on each request. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let env: SupabaseEnv;
  try {
    env = getSupabaseEnv();
  } catch (error) {
    // Missing keys must not take the whole site down in development.
    console.warn(error instanceof Error ? error.message : "Supabase is not configured");
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not put any code between createServerClient and getUser.
  await supabase.auth.getUser();

  return response;
}
