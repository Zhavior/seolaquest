# Axion Platform - Next.js 16 Production App

Axion is a high-performance Next.js application integrated with Stripe billing, X (Twitter) posting, and Gemini AI assistant chat.

---

## 🛠️ Environment Setup

Copy `.env.example` to `.env.local` before starting the application:

```bash
cp .env.example .env.local
```

### Required Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_123
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# X (Twitter) API Configuration (OAuth 1.0a User Context)
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_ACCESS_TOKEN=your_x_access_token
X_ACCESS_TOKEN_SECRET=your_x_access_token_secret

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🔒 Security Principles

- **Server-Only Isolation:** All API keys (`STRIPE_SECRET_KEY`, `X_API_*`, `GEMINI_API_KEY`) are protected using `import 'server-only'` safeguards in `lib/`. They are never imported or leaked to client components.
- **Strict Input Validation:** All API endpoints validate incoming JSON payloads using **Zod** schemas prior to processing.
- **Environment Confidentiality:** `.env.local` is ignored in `.gitignore` and must never be committed to source control.

---

## 🚀 Integration Overview

### 1. Stripe Checkout
- Endpoint: `POST /api/stripe/checkout`
- Uses `STRIPE_PRICE_ID` configured on the server (browser price ID overrides are rejected).
- Generates subscription checkout sessions redirecting to Stripe hosted checkout.

### 2. X / Twitter Publishing
- Endpoint: `POST /api/x/post`
- Uses `twitter-api-v2` with authenticated OAuth 1.0a user context for posting tweets (requires Read & Write app permissions on the X Developer Portal).
- Features live character counting (280 max) and in-memory per-process rate limiting (5 posts / 60 seconds).

### 3. Gemini AI Assistant Chat
- Endpoint: `POST /api/gemini/chat`
- Powered by `@google/genai` using `gemini-2.5-flash` model.
- Maintains conversation state in React client state with system prompt enforcement and 15s request timeout protection.

---

## 💻 Development Commands

```bash
# Run local development server
npm run dev

# Run TypeScript compilation check
npm run build
```

---

## 📌 Known Production Follow-Ups

1. **Persistent Rate Limiting:** Upgrade in-memory X rate limiter to Redis/Upstash for distributed serverless scaling across multiple Vercel edge/lambda instances.
2. **Stripe Webhook Handler:** Implement raw signature verification endpoint (`/api/stripe/webhook`) using `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` to persist customer subscription statuses.
3. **User Authentication & Customer Mapping:** Map Stripe `customer_id` and X OAuth tokens to authenticated user records in Supabase / Prisma database.
