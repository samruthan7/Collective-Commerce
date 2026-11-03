import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/domain/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/authForm";
import { loginAction } from "@/lib/authActions";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeRedirectPath(Array.isArray(rawNext) ? rawNext[0] : rawNext);

  if (await getCurrentUser()) redirect(next);

  return <AuthForm mode="login" action={loginAction} next={next} />;
}
