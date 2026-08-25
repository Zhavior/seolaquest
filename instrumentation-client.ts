// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7d10eb8b9b689adde94c74b5afccd75e@o4511702785458176.ingest.us.sentry.io/4511719802601472",

  // Session Replay is deliberately NOT listed here. Referencing
  // `Sentry.replayIntegration()` statically pulls it into the initial bundle of
  // every route — 123 KB uncompressed, measured with
  // `node scripts/check-bundle-size.mjs`. It is attached after the page is
  // interactive instead; see the bottom of this file.
  integrations: [],

  // Sampled in production for the same reason as sentry.server.config.ts.
  // Ad traffic lands on the marketing pages, so this is the noisiest surface.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // See sentry.server.config.ts — request bodies carry tenant data.
    httpBodies: [],
  },
});

// Attach Session Replay once the page is interactive, so its weight is not on
// the critical path. The sampling rates above still govern it — Replay reads
// them from the client options, not from the call below.
//
// The trade, stated plainly: Replay is no longer recording during the first
// moments of a page load, so an error thrown that early will not have a replay
// attached even though replaysOnErrorSampleRate is 1.0. Errors during actual
// interaction — which is nearly all of them — are unaffected. Revert by moving
// `Sentry.replayIntegration()` back into `integrations` above if that trade ever
// stops being worth 123 KB on every route.
function attachSessionReplay() {
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(replayIntegration());
    })
    .catch(() => {
      // Replay ships from Sentry's CDN. If that request fails the page is fine
      // and errors are still reported — only the replay is missing, so this must
      // stay silent rather than becoming a console error users can see.
    });
}

if (typeof window !== 'undefined') {
  // `typeof` rather than `'requestIdleCallback' in window`: the `in` form narrows
  // window to `never` in the else branch, since the property is declared on the
  // Window type even where it is not implemented at runtime (Safari).
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(attachSessionReplay, { timeout: 5000 });
  } else {
    window.setTimeout(attachSessionReplay, 2000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
