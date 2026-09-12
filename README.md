# 🔥 RoastMe AI

**Your life. Your internet history. Your terrible decisions. Roasted by AI.**

A production-quality MVP of a viral consumer web app: you hand over a bio, a
profile, a few screenshots or just a paragraph about yourself, and an AI returns
a funny, specific, personalized roast. The free roast gives you a score, a
headline and a few red flags. The full roast — a one-time $1.99 purchase through
Lemon Squeezy — unlocks the rest.

Everything in this repo is wired end-to-end. There are no stubbed integrations
and no placeholder handlers. The only things you must supply are credentials and
a database.

---

## Contents

- [What's built](#whats-built)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [Lemon Squeezy setup](#lemon-squeezy-setup)
- [Storage](#storage)
- [Analytics](#analytics)
- [Admin dashboard](#admin-dashboard)
- [Rate limiting and cost control](#rate-limiting-and-cost-control)
- [Safety](#safety)
- [Testing and verification](#testing-and-verification)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Manual configuration checklist](#manual-configuration-checklist)

---

## What's built

**The funnel.** Landing page → roast input → AI generation → free roast →
paywall → Lemon Squeezy checkout → webhook → full roast → share card → friend
link → new user.

- **Landing page** with hero, marquee, labelled example reactions, how-it-works,
  a worked example roast, categories, sample share cards, pricing, FAQ and a
  final CTA.
- **Conversational 3-step input** — who are we roasting, give us ammunition
  (paste text / upload up to 5 screenshots / describe yourself), pick a roast
  level and angles. No traditional form, no account, no OAuth.
- **Entertaining loading experience** with cycling copy and a progress bar. The
  messages are UI only; they don't pretend to describe backend steps.
- **Free roast**: animated score dial, headline, 2–3 paragraph roast, 3 red
  flags, 2 green flags, main character energy.
- **Paywall** with blurred locked cards. The locked *content is never sent to
  the browser* — only the teaser titles are.
- **Payment** through a `PaymentProvider` abstraction. Fulfilment happens only
  in the signature-verified webhook; returning to `/success` grants nothing.
- **Full roast**: brutal summary, 5–7 red flags, 3–5 green flags, career, money,
  social and dating roasts, main character arc, self-sabotage pattern, what your
  friends would roast you for, and a final verdict — behind a "Reveal
  Everything" animation.
- **Share card**: a 1200×630 PNG generated server-side with `next/og`,
  downloadable, plus an X intent link and an unguessable `/share/[token]` friend
  page that shows only the score and one quote.
- **Admin dashboard** at `/admin` behind `ADMIN_SECRET`.
- **Privacy and terms** pages that describe what the code actually does.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 with a CSS-first theme |
| Components | shadcn-style primitives on Radix UI |
| Animation | Framer Motion |
| Database | PostgreSQL via Prisma 6 |
| AI | OpenAI Chat Completions (JSON mode, vision-capable) |
| Payments | Lemon Squeezy hosted checkout + webhooks |
| Images | `next/og` (Satori) for share cards; Vercel Blob or local disk for uploads |
| Tests | Vitest (unit) + a Playwright-driven journey script |

---

## Quick start

Requirements: Node 20+, a PostgreSQL 14+ database, an OpenAI API key.

```bash
git clone <your-repo-url> roastme-ai
cd roastme-ai
npm install

cp .env.example .env.local
# then fill in DATABASE_URL and OPENAI_API_KEY at minimum

npm run db:migrate     # creates the schema
npm run db:seed        # optional: one example roast + share link
npm run dev            # http://localhost:43127
```

The dev server runs on port **43127** (an uncommon port, so it won't fight with
whatever else you have running). Change it in `package.json` if you like.

### Running without an OpenAI key

If you want to click through the whole funnel before you have a key, set
`DEV_FAKE_AI=true` in `.env.local`. Roasts are then produced by a local fixture
generator (`lib/ai/fixtures.ts`) that echoes back your real input, so the
paywall, webhook, share card and friend link can all be exercised.

This is deliberately fenced off: the flag is ignored whenever
`NODE_ENV=production`, and the fixture module is never reachable from the
production code path in `lib/ai/generate.ts`. **Leave it `false` for anything
real.**

---

## Environment variables

Copy `.env.example` to `.env.local`. Nothing throws at import time, so the app
boots with pieces missing and tells you what's unconfigured when you try to use
them.

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `OPENAI_API_KEY` | ✅ | Server-side only. Never exposed to the browser. |
| `OPENAI_MODEL` | | Defaults to `gpt-4o-mini`. Any modern chat model with JSON mode; vision is used automatically when screenshots are attached. |
| `DEV_FAKE_AI` | | `true` serves fixture roasts in development only. |
| `NEXT_PUBLIC_APP_URL` | ✅ | No trailing slash. Used for checkout redirects, share links, OG tags, sitemap. |
| `LEMON_SQUEEZY_API_KEY` | ✅ for payments | From Lemon Squeezy → Settings → API. |
| `LEMON_SQUEEZY_STORE_ID` | ✅ for payments | Numeric store ID. |
| `LEMON_SQUEEZY_VARIANT_ID_FULL_ROAST` | ✅ for payments | Variant ID of the $1.99 product. |
| `LEMON_SQUEEZY_VARIANT_ID_ULTIMATE_ROAST` | | Optional $4.99 product. The architecture supports it; the UI ships only the $1.99 tier. |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | ✅ for payments | Signing secret for the webhook. |
| `LEMON_SQUEEZY_TEST_MODE` | | `true` creates test-mode checkouts. |
| `ADMIN_SECRET` | ✅ for `/admin` | Long random string. Also authorises the upload-cleanup cron. |
| `ANALYTICS_PROVIDER` | | `db` (default), `posthog`, or `none`. |
| `NEXT_PUBLIC_ANALYTICS_KEY` / `NEXT_PUBLIC_ANALYTICS_HOST` | | PostHog project key and host. |
| `STORAGE_PROVIDER` | | `local` (default, writes to `public/uploads`) or `vercel-blob`. |
| `BLOB_READ_WRITE_TOKEN` | ✅ for blob storage | Injected automatically on Vercel when a Blob store is attached. |
| `STORAGE_BUCKET` | | Key prefix for uploaded files. |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | | Reserved for S3/Cloudinary providers added later. |
| `UPLOAD_RETENTION_HOURS` | | Screenshots are purged after this many hours. Default 24. |
| `RATE_LIMIT_ROASTS_PER_DAY` | | Default 3, per IP and per session. |
| `RATE_LIMIT_CHECKOUTS_PER_HOUR` | | Default 10. |
| `RATE_LIMIT_UPLOADS_PER_HOUR` | | Default 20. |

Never commit `.env` files. `.gitignore` already excludes them.

---

## Database and migrations

```bash
npm run db:migrate     # prisma migrate dev — create + apply during development
npm run db:deploy      # prisma migrate deploy — apply in CI/production
npm run db:generate    # regenerate the Prisma client
npm run db:seed        # insert one example roast, payment and share link
npm run db:studio      # browse the data
```

The generated Prisma client lives in `lib/generated/prisma` and is gitignored;
`npm install` and `npm run build` both regenerate it.

**Models:** `User`, `RoastSession`, `RoastResult`, `Payment`, `Share`,
`EmailCapture`, `AnalyticsEvent`, `RateLimitHit`, `UploadedImage`.

Two constraints matter:

- `Payment` has a unique index on `(provider, providerOrderId)`, which is what
  makes duplicate webhook deliveries idempotent.
- `RoastResult` stores both free and premium columns. Premium columns are
  populated at generation time but only serialised once `RoastSession.isPaid` is
  true — see `toRoastView()` in `lib/roast/service.ts`.

---

## Lemon Squeezy setup

### 1. Create the store and product

1. Sign up at [lemonsqueezy.com](https://www.lemonsqueezy.com) and create a store.
2. **Products → New Product.**
   - Name: `Full Roast`
   - Pricing: **One-time payment**, `$1.99 USD`
   - Do **not** create a subscription.
3. Publish the product. Open it and copy the **variant ID** — it's the numeric id
   in the variant's URL (`.../variants/123456`), not the product ID.
4. Copy your **store ID** from Settings → Stores.

If you later want the optional $4.99 tier, repeat this for an `Ultimate Roast`
product and set `LEMON_SQUEEZY_VARIANT_ID_ULTIMATE_ROAST`. The
`PaymentProvider` and the `PRODUCTS` map already handle it.

### 2. Create the API key

**Settings → API → +** . Copy the key into `LEMON_SQUEEZY_API_KEY`. It is only
ever used server-side.

### 3. Configure the webhook

**Settings → Webhooks → +**

- **Callback URL:** `https://your-domain.com/api/webhooks/lemon-squeezy`
- **Signing secret:** generate a long random string and put the same value in
  `LEMON_SQUEEZY_WEBHOOK_SECRET`.
- **Events:** at minimum `order_created`. Add `order_refunded` if you want
  refunds to revoke access (the handler supports it).

The handler verifies the `X-Signature` HMAC-SHA256 digest against the raw
request body in constant time before parsing anything. Unverified requests get a
401 and change nothing.

### 4. Testing payments

Turn on test mode in Lemon Squeezy, keep `LEMON_SQUEEZY_TEST_MODE=true`, and use
their test card. For local development the webhook needs a public URL — use
`ngrok http 43127` (or the Lemon Squeezy CLI) and point the webhook at the
tunnel.

You can also exercise fulfilment without any Lemon Squeezy account at all by
posting a correctly signed body yourself:

```bash
BODY='{"meta":{"event_name":"order_created","custom_data":{"sessionId":"<ROAST_ID>","roastId":"r","productType":"FULL_ROAST"}},"data":{"id":"order_test_1","attributes":{"identifier":"pay_test_1","status":"paid","total":199,"currency":"USD","user_email":"buyer@example.com"}}}'
SIG=$(node -e "const c=require('crypto');console.log(c.createHmac('sha256',process.env.LEMON_SQUEEZY_WEBHOOK_SECRET).update(process.argv[1],'utf8').digest('hex'))" "$BODY")

curl -X POST http://localhost:43127/api/webhooks/lemon-squeezy \
  -H 'Content-Type: application/json' -H "X-Signature: $SIG" -d "$BODY"
```

---

## Storage

Uploads go through the `StorageProvider` abstraction in `lib/storage`.

- **`local`** writes to `public/uploads`. Good for development. Not suitable for
  Vercel, where the filesystem is ephemeral and per-instance.
- **`vercel-blob`** uses Vercel Blob. Create a Blob store in your Vercel project
  and `BLOB_READ_WRITE_TOKEN` is injected for you.

Every upload is validated server-side by **sniffing magic bytes** — the
browser-supplied MIME type is never trusted. Only PNG, JPEG and WEBP are
accepted, at most 5 files, 5 MB each.

Screenshots are deleted after `UPLOAD_RETENTION_HOURS`. The cleanup schedule
lives in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/cleanup-uploads", "schedule": "0 3 * * *" }]
}
```

The endpoint requires `Authorization: Bearer $ADMIN_SECRET`.

The schedule is daily because Vercel's Hobby plan rejects any cron that fires
more than once per day. A sweep only deletes images already older than
`UPLOAD_RETENTION_HOURS`, so with daily runs a file can outlive its retention
window by up to 24 hours before the next sweep collects it. If you need the
window enforced tightly, either lower `UPLOAD_RETENTION_HOURS`, move to the Pro
plan and use `0 * * * *`, or drive the endpoint from an external scheduler.

> Note: when `STORAGE_PROVIDER=local`, uploaded screenshots live on
> `localhost`, which OpenAI cannot fetch. Vision analysis therefore only kicks
> in once you're on a publicly reachable storage provider. The code filters
> loopback URLs out of the vision payload rather than sending a URL that would
> fail.

---

## Analytics

Fourteen funnel events are tracked: `landing_page_view`, `roast_started`,
`input_submitted`, `image_uploaded`, `roast_generated`, `free_result_viewed`,
`paywall_viewed`, `checkout_started`, `checkout_completed`,
`premium_roast_revealed`, `share_clicked`, `share_card_downloaded`,
`friend_roast_clicked`, `email_submitted`.

Events always mirror into Postgres (that's what `/admin` reads) and additionally
forward to PostHog when `ANALYTICS_PROVIDER=posthog`. Only scalar properties are
persisted — no free text a user typed ever ends up in analytics.

---

## Admin dashboard

Visit `/admin` and enter `ADMIN_SECRET`. It's compared in constant time and kept
in an httpOnly cookie for 8 hours. The dashboard shows sessions, roasts
generated, free vs paid, paywall views, checkout starts, conversion rates,
revenue, share clicks, card downloads, emails captured, top roast categories and
recent payments. That's the whole thing — it is intentionally not an admin
system.

---

## Rate limiting and cost control

Rate limiting is a fixed-window counter in Postgres (`RateLimitHit`), not an
in-process map — serverless instances don't share memory, so a memory counter
would be bypassed by hitting a cold instance. Roast generation is limited per IP
**and** per anonymous session.

Cost control: **one** model call produces the entire roast, free and premium
sections together. Payment unlocks what's already stored; it never triggers a
second generation. Refreshing a result page never regenerates anything, and
`POST /api/roast/[id]/generate` returns the existing result untouched if one
exists.

---

## Safety

The system prompt in `lib/ai/prompt.ts` forbids attacks on protected
characteristics, slurs, threats, sexual content, doxxing, harassment,
self-harm encouragement, and medical/legal/financial/psychological diagnoses. It
targets behaviours, choices, habits and contradictions instead, and is told to
joke about missing information rather than inventing facts about a real person.

The UI reinforces this: roasting someone other than yourself requires an
explicit permission confirmation, the money section is labelled "not financial
advice", the main character arc is labelled fiction, and the friends section is
labelled humorous speculation.

---

## Testing and verification

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run build       # prisma generate + next build
npm run test        # vitest — 49 unit tests
```

The unit tests cover AI response parsing and schema validation, input
validation, webhook signature verification (including tampered bodies and
truncated signatures), duplicate and refund webhook handling, premium content
gating, share token generation, rate limiting, and upload MIME sniffing.

Two browser scripts verify the real thing against a running server. They need a
Chrome binary (`CHROME=/path/to/chrome`):

```bash
npm run verify:journey      # full funnel in a real browser + screenshots
npm run verify:responsive   # horizontal-overflow check at six breakpoints
```

`verify:journey` walks the homepage, the three input steps, the loading screen,
the free result, the paywall, a checkout click, a signed webhook POST, the
reveal gate, all eight premium sections, a fresh page load, the PNG download,
and the friend link — asserting at each stage that premium content was not
leaked before payment.

---

## Deploying to Vercel

1. Push this repo to GitHub and import it at
   [vercel.com/new](https://vercel.com/new). The framework preset is detected
   automatically.
2. **Provision Postgres.** Vercel Postgres, Neon and Supabase all work. Copy the
   pooled connection string into `DATABASE_URL`.
3. **Add environment variables** for Production (and Preview, if you want it to
   work) — every required row from the table above. `NEXT_PUBLIC_APP_URL` must
   be your real domain with no trailing slash.
4. **Add a Blob store** (Storage → Create → Blob) and set
   `STORAGE_PROVIDER=vercel-blob`.
5. **Migrations run during the build.** `vercel.json` sets the build command to
   `prisma migrate deploy && prisma generate && next build`, so each deploy
   applies any pending migrations before building. `migrate deploy` is
   idempotent — it applies only what's outstanding and is a no-op when the
   database is current. `DATABASE_URL` must therefore be readable at *build*
   time, not just at runtime.

   To apply them by hand instead, drop `buildCommand` from `vercel.json` and run:
   ```bash
   DATABASE_URL="<production-url>" npm run db:deploy
   ```

   > If migrations fail against a pooled connection string, run them against the
   > provider's **direct** URL instead. Neon and Supabase front their pooled
   > endpoints with PgBouncer in transaction mode, which can't execute the DDL
   > and advisory locks migrations need. Keep the pooled URL in `DATABASE_URL`
   > for the app; use the direct URL only for migrating.
6. **Point the Lemon Squeezy webhook** at
   `https://your-domain.com/api/webhooks/lemon-squeezy`.
7. The cleanup cron is already registered in `vercel.json`; just set
   `ADMIN_SECRET` so it can authenticate.
8. Deploy, then walk the funnel once with a Lemon Squeezy test payment.

`maxDuration` is set to 120s on the roast routes. On Vercel's Hobby plan the
ceiling is lower, so a slow model may time out — use a fast model or a paid plan.

---

## Project structure

```
app/
  page.tsx                              landing page
  roast/page.tsx                        3-step input flow
  roast/[id]/page.tsx                   free + premium result
  share/[token]/page.tsx                public friend link
  success/page.tsx                      post-checkout, polls for the webhook
  admin/page.tsx                        dashboard behind ADMIN_SECRET
  privacy/, terms/                      MVP legal pages
  error.tsx, not-found.tsx              friendly error states
  robots.ts, sitemap.ts
  api/
    roast/route.ts                      POST — create + generate
    roast/[id]/route.ts                 GET  — gated result
    roast/[id]/generate/route.ts        POST — retry (never regenerates)
    payment/create-checkout/route.ts    POST — Lemon Squeezy checkout
    webhooks/lemon-squeezy/route.ts     POST — the only path that grants access
    share/route.ts, share/[token]/route.ts
    share-card/[id]/route.tsx           1200x630 PNG
    og/route.tsx                        default OG image
    upload/route.ts                     screenshots, MIME-sniffed
    email/route.ts                      optional email capture
    analytics/route.ts                  funnel events
    cron/cleanup-uploads/route.ts       retention sweep
components/
  Hero, Navbar, Footer, RoastInput, RoastLoading, RoastResult, RoastRetry,
  Paywall, PaymentButton, ShareCard, ShareButtons, ScoreDial, EmailCapture,
  SuccessPending, landing/, ui/
lib/
  ai/          prompt, JSON schema, generation, dev fixtures
  payments/    PaymentProvider interface + Lemon Squeezy implementation
  storage/     StorageProvider interface + local and Vercel Blob
  analytics/   server + client tracking, event list
  rate-limit/  Postgres fixed-window limiter
  roast/       premium gating and view serialisation
  admin/       auth + dashboard stats
  db/          Prisma client singleton
prisma/
  schema.prisma, migrations/, seed.ts
scripts/
  verify-journey.mjs, check-responsive.mjs
tests/
  49 Vitest tests
```

---

## Manual configuration checklist

Everything below needs a human. Nothing else does.

**Before it works at all**

- [ ] Provision a PostgreSQL database and set `DATABASE_URL`.
- [ ] Run `npm run db:migrate` (local) or `npm run db:deploy` (production).
- [ ] Create an OpenAI API key and set `OPENAI_API_KEY`.
- [ ] Pick a model and set `OPENAI_MODEL` (defaults to `gpt-4o-mini`).
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real URL, with no trailing slash.
- [ ] Confirm `DEV_FAKE_AI` is `false` (or absent) anywhere real.

**Before you can take money**

- [ ] Create a Lemon Squeezy store.
- [ ] Create the **Full Roast** product as a **one-time** $1.99 payment.
- [ ] Copy the **variant ID** into `LEMON_SQUEEZY_VARIANT_ID_FULL_ROAST`.
- [ ] Copy the **store ID** into `LEMON_SQUEEZY_STORE_ID`.
- [ ] Create an API key → `LEMON_SQUEEZY_API_KEY`.
- [ ] Create the webhook at `/api/webhooks/lemon-squeezy`, subscribe to
      `order_created` (and `order_refunded` if you want refunds to revoke
      access), and set the same signing secret in
      `LEMON_SQUEEZY_WEBHOOK_SECRET`.
- [ ] Complete one test-mode purchase and confirm the roast unlocks.
- [ ] Set `LEMON_SQUEEZY_TEST_MODE=false` when you go live.

**Before users upload screenshots**

- [ ] Create a Vercel Blob store and set `STORAGE_PROVIDER=vercel-blob`.
- [ ] Decide on `UPLOAD_RETENTION_HOURS` and add the cleanup cron to
      `vercel.json`.

**Operational**

- [ ] Set a long random `ADMIN_SECRET` and check `/admin` loads.
- [ ] Choose `ANALYTICS_PROVIDER`; add `NEXT_PUBLIC_ANALYTICS_KEY` for PostHog.
- [ ] Tune `RATE_LIMIT_*` for your traffic and budget.
- [ ] Add your domain in Vercel and update `NEXT_PUBLIC_APP_URL`.

**Legal and content — do not skip**

- [ ] Have a lawyer review `/privacy` and `/terms`. They are honest MVP
      documents describing what the code does; they are not legal advice and are
      not sufficient for a commercial launch on their own.
- [ ] Put a real contact address on the privacy page so people can request
      deletion.
- [ ] Replace the "Example reactions" testimonials with real ones once you have
      them, or delete the section. They are labelled as examples on purpose.
- [ ] Read a dozen real outputs at each roast level before launching, and tighten
      `lib/ai/prompt.ts` if anything crosses a line.

---

## License

No license file is included. Add one before publishing.
