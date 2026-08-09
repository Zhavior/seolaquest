// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7d10eb8b9b689adde94c74b5afccd75e@o4511702785458176.ingest.us.sentry.io/4511719802601472",

  // Errors are always captured; this rate governs performance traces only.
  // 100% is the wizard default and is fine locally, but once advertising sends
  // real traffic it burns the quota on transactions nobody reads. Sample in
  // production, keep full fidelity while developing.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // Request bodies here carry other people's data: scanned posts, lead
    // records, and keyword configuration belonging to tenants. Sending that to
    // a third party is not something an error report needs, and /privacy makes
    // specific claims about where tenant data goes. Stack traces and the user
    // identity below are enough to debug with.
    httpBodies: [],
  },
});
