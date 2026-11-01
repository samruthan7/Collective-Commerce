import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonStyles";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-accent-600">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-500">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className={`${buttonClasses("primary")} mt-6`}>
        Back to home
      </Link>
    </main>
  );
}
