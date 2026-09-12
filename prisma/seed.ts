/**
 * Seeds one complete example journey (session -> result -> paid payment ->
 * share link) so a fresh database has something to look at in /admin and a
 * working /share/... link to click. Safe to run repeatedly.
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../lib/generated/prisma";
import { buildFixtureRoast } from "../lib/ai/fixtures";
import { aiRoastToResultData, newShareToken, newSessionToken } from "../lib/roast/service";

// Prisma CLI loads `.env`; `tsx prisma/seed.ts` does not. Load both so local
// `.env.local` (Next.js) and `.env` (Prisma) work the same way.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const prisma = new PrismaClient();

const SEED_TOKEN = "seed-demo-session";

async function main() {
  const existing = await prisma.roastSession.findFirst({ where: { sessionToken: SEED_TOKEN } });
  if (existing) {
    console.log(`Seed session already exists: ${existing.id}`);
    return;
  }

  const inputText =
    "27, product manager at a Series A startup. Three side projects, none launched. Gym four times a week (in theory). 400 unread emails. Currently learning Rust. I spend too much money on mechanical keyboards and matcha.";

  const roast = buildFixtureRoast({
    subjectType: "myself",
    roastLevel: "savage",
    categories: ["full_life", "career", "money"],
    pastedText: inputText,
    aboutText: "",
    imageCount: 0,
  });

  const session = await prisma.roastSession.create({
    data: {
      sessionToken: newSessionToken(),
      subjectType: "myself",
      inputText,
      imageUrls: [],
      roastLevel: "savage",
      categories: ["full_life", "career", "money"],
      status: "READY",
      isPaid: true,
    },
  });

  await prisma.roastResult.create({
    data: {
      sessionId: session.id,
      premiumGeneratedAt: new Date(),
      ...aiRoastToResultData(roast, "seed-fixture"),
    },
  });

  await prisma.payment.create({
    data: {
      sessionId: session.id,
      provider: "lemon_squeezy",
      providerOrderId: `seed-order-${session.id.slice(0, 8)}`,
      providerPaymentId: `seed-pay-${session.id.slice(0, 8)}`,
      product: "FULL_ROAST",
      amount: 199,
      currency: "USD",
      status: "PAID",
    },
  });

  const share = await prisma.share.create({
    data: { sessionId: session.id, shareToken: newShareToken() },
  });

  await prisma.roastSession.update({ where: { id: session.id }, data: { sessionToken: SEED_TOKEN } });

  console.log(`Seeded roast:  /roast/${session.id}`);
  console.log(`Seeded share:  /share/${share.shareToken}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
