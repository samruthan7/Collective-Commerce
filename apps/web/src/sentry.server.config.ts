import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

// With no DSN (local development) Sentry stays off.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      databaseQueryData: false,
      queues: false,
      genAI: { inputs: false, outputs: false },
    },
  });
}
