import { z } from 'zod'

/**
 * Only the variables something actually reads through this module belong here.
 *
 * The Stripe entries were removed: billing reads `STRIPE_SECRET_KEY`,
 * `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FOUNDER`, and `STRIPE_PRICE_BETA`
 * straight from `process.env` (see `src/modules/billing`), and the schema's
 * `STRIPE_PRICE_ID` was not one of them — it defaulted to the placeholder
 * `'price_123'`, which made the old `stripeConfigured` flag always report true
 * whenever a secret key was present. A config check that cannot fail is worse
 * than no check. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` went with it: Checkout
 * redirects server-side, nothing imports `@stripe/stripe-js`, and no client
 * code reads the key.
 */
const serverEnvSchema = z.object({
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  X_ACCESS_TOKEN: z.string().optional(),
  X_ACCESS_TOKEN_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional().default('gemini-2.5-flash'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv cannot be called on the client side.')
  }
  return serverEnvSchema.parse({
    X_API_KEY: process.env.X_API_KEY,
    X_API_SECRET: process.env.X_API_SECRET,
    X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN,
    X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
}
