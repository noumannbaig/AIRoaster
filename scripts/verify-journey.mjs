/**
 * End-to-end check of the real user journey in a real browser:
 *   homepage -> roast flow -> loading -> free roast -> paywall -> checkout call
 *   -> signed webhook -> full roast -> share card PNG -> friend link -> mobile
 *
 * Requires a running server (`npm run dev`) and a Chrome binary.
 * Override with BASE, CHROME, SHOTS and LEMON_SQUEEZY_WEBHOOK_SECRET.
 *
 *   npm run verify:journey
 */
import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://127.0.0.1:43127";
const CHROME = process.env.CHROME ?? "/opt/google/chrome/chrome";
const SHOTS = process.env.SHOTS ?? "./screenshots";
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "local_dev_webhook_secret";

const log = (...args) => console.log("•", ...args);

mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 300)));

// ---------------------------------------------------------------- 1. homepage
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/roastme-homepage.png` });
log("homepage h1:", (await page.locator("h1").first().innerText()).replace(/\n/g, " "));
log("saved roastme-homepage.png");

// ------------------------------------------------------------- 2. roast flow
await page.getByRole("link", { name: /Roast Me 🔥/ }).first().click();
await page.waitForURL("**/roast");
await page.waitForTimeout(800);
log("step 1 title:", await page.locator("h1").innerText());

await page.getByRole("button", { name: /Myself/ }).click();
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(600);
log("step 2 title:", await page.locator("h1").innerText());

await page
  .getByPlaceholder(/Paste your bio/)
  .fill(
    "Senior Product Designer @ fintech. Ex-agency. Building in public. Host of a podcast (2 episodes). 'Design is problem solving.'",
  );
await page
  .getByPlaceholder(/I'm a 25-year-old software engineer/)
  .fill(
    "I'm 29. I have six Notion workspaces, two unfinished newsletters and a Figma file literally called final-FINAL-v3. I buy plants and name them after deadlines I missed. I've been 'about to launch' since March.",
  );
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(600);
log("step 3 title:", await page.locator("h1").innerText());

await page.getByRole("button", { name: /Savage/ }).first().click();
await page.getByRole("button", { name: /Roast me 🔥/ }).click();

// ------------------------------------------------------------ 3. loading UX
await page.waitForTimeout(700);
const loadingText = await page.locator("body").innerText();
log(
  "loading screen visible:",
  /Reading your bio|Scanning your questionable|Generating your roast/.test(loadingText),
);

await page.waitForURL("**/roast/*", { timeout: 60_000 });
const sessionId = page.url().split("/roast/")[1].split("?")[0];
log("roast session:", sessionId);

// --------------------------------------------------------- 4. free result
await page.waitForTimeout(3000);
const score = await page.locator("text=/^\\d+$/").first().innerText();
log("animated score:", score);
await page.screenshot({ path: `${SHOTS}/roastme-free-result.png` });
log("saved roastme-free-result.png");

const freeBody = await page.locator("body").innerText();
const freeApi = await (await fetch(`${BASE}/api/roast/${sessionId}`)).json();
log(
  "free API withholds premium fields:",
  !["careerRoast", "moneyRoast", "finalVerdict", "selfSabotage"].some((k) => k in freeApi.roast),
);

// ------------------------------------------------------------- 5. paywall
// Scroll through the whole paywall so every card's reveal animation has fired,
// then clip a full-page capture to exactly that section.
await page.getByRole("button", { name: /Unlock My Full Roast/ }).scrollIntoViewIfNeeded();
await page.waitForTimeout(1800);
const paywallBox = await page.evaluate(() => {
  const section = [...document.querySelectorAll("section")].find((s) =>
    s.textContent?.includes("Wait. We found more."),
  );
  const rect = section.getBoundingClientRect();
  return { x: rect.x, y: rect.y + window.scrollY - 24, width: rect.width, height: rect.height + 48 };
});
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/roastme-paywall.png`, fullPage: true, clip: paywallBox });
log("saved roastme-paywall.png");
log("paywall CTA:", await page.getByRole("button", { name: /Unlock My Full Roast/ }).innerText());

// --------------------------------------------------- 6. checkout attempt
await page.getByRole("button", { name: /Unlock My Full Roast/ }).click();
await page.waitForTimeout(2500);
const afterCheckout = await page.locator("body").innerText();
log(
  "checkout call made, real provider error surfaced:",
  /Lemon Squeezy|Checkout didn't open/i.test(afterCheckout),
);

// ------------------------------------------------- 7. signed test webhook
const body = JSON.stringify({
  meta: {
    event_name: "order_created",
    custom_data: { sessionId, roastId: "r", productType: "FULL_ROAST" },
  },
  data: {
    id: `order_journey_${Date.now()}`,
    attributes: {
      identifier: "pay_journey_1",
      status: "paid",
      total: 199,
      currency: "USD",
      user_email: "buyer@example.com",
    },
  },
});
const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body, "utf8").digest("hex");
const webhookResponse = await fetch(`${BASE}/api/webhooks/lemon-squeezy`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-signature": signature },
  body,
});
log("webhook:", webhookResponse.status, JSON.stringify(await webhookResponse.json()));

// ------------------------------------------------------- 8. success page
await page.goto(`${BASE}/success?session=${sessionId}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
log("success redirected to:", page.url());
const revealButton = await page.getByRole("button", { name: /Reveal Everything/ }).count();
log("reveal gate shown:", revealButton > 0);
if (revealButton > 0) {
  await page.getByRole("button", { name: /Reveal Everything/ }).click();
  await page.waitForTimeout(1200);
}

// --------------------------------------------------------- 9. full roast
await page.getByText("Your career roast").scrollIntoViewIfNeeded();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${SHOTS}/roastme-full-roast.png` });
log("saved roastme-full-roast.png");

// innerText reflects CSS text-transform, so compare case-insensitively.
const paidBody = (await page.locator("body").innerText()).toLowerCase();
for (const raw of [
  "Your career roast",
  "Your money personality",
  "Your social roast",
  "Your dating roast",
  "Your main character arc",
  "Your biggest self-sabotage pattern",
  "What your friends would roast you for",
  "The final verdict",
]) {
  if (!paidBody.includes(raw.toLowerCase())) throw new Error(`missing premium section: ${raw}`);
}
log("all 8 premium sections present");

// The premium prose must not have been present on the free page earlier.
const paidApi = await (await fetch(`${BASE}/api/roast/${sessionId}`)).json();
log(
  "free page never contained the premium prose:",
  [paidApi.roast.careerRoast, paidApi.roast.moneyRoast, paidApi.roast.finalVerdict].every(
    (text) => !freeBody.includes(text.slice(0, 60)),
  ),
);

// ------------------------------------- 10. refresh keeps premium unlocked
await page.goto(`${BASE}/roast/${sessionId}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
log(
  "premium survives a fresh page load:",
  (await page.locator("body").innerText()).toLowerCase().includes("your money personality"),
);

// ------------------------------------------------------ 11. download PNG
const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
await page.getByRole("button", { name: /Download Roast Card/ }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Download Roast Card/ }).click();
const download = await downloadPromise;
const savedTo = `/tmp/${download.suggestedFilename()}`;
await download.saveAs(savedTo);
log("downloaded share card:", download.suggestedFilename(), "->", savedTo);

// -------------------------------------------------------- 12. friend link
const shareResponse = await fetch(`${BASE}/api/share`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sessionId }),
});
const { shareToken } = await shareResponse.json();
await page.goto(`${BASE}/share/${shareToken}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const shareBody = (await page.locator("body").innerText()).toLowerCase();
log("friend page headline:", shareBody.includes("someone thinks you need an ai roast"));
log("friend page hides roast body:", !shareBody.includes("your money personality"));

await page.getByRole("link", { name: /Accept the challenge/ }).click();
await page.waitForURL("**/roast**");
await page.waitForTimeout(800);
log("friend lands on:", await page.locator("h1").innerText());

// --------------------------------------------------------- 13. mobile pass
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const path of ["/", "/roast", `/roast/${sessionId}`, `/share/${shareToken}`]) {
  await mobile.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(900);
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  log(`mobile 390px ${path}: horizontal overflow ${overflow}px`);
}

await browser.close();
console.log("\nJOURNEY COMPLETE — session", sessionId, "share", shareToken);
