// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7d10eb8b9b689adde94c74b5afccd75e@o4511702785458176.ingest.us.sentry.io/4511719802601472",

  // Sampled in production for the same reason as sentry.server.config.ts.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // See sentry.server.config.ts — request bodies carry tenant data.
    httpBodies: [],
  },
});
