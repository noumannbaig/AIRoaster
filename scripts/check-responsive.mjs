import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://127.0.0.1:43127";
const PATHS = process.argv.slice(2);

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/opt/google/chrome/chrome",
  args: ["--no-sandbox"],
});

for (const width of [375, 390, 430, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const path of PATHS) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const result = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      navbarSticky: getComputedStyle(document.querySelector("header")).position,
    }));
    console.log(
      `${String(width).padStart(4)}px ${path.padEnd(34)} overflow ${result.overflow}px  navbar:${result.navbarSticky}`,
    );
  }
  await page.close();
}

await browser.close();
