import { expect, test } from "@playwright/test";

test("Chromium reads the install manifest and controls public learning routes", async ({ page }) => {
  await page.goto("/en/");
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestUrl).toBe("/assets/web/site.webmanifest");
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.status()).toBe(200);
  expect(manifestResponse.headers()["content-type"]).toMatch(/application\/manifest\+json/);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("/en/");
  expect(manifest.scope).toBe("/");
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/image\/png/);
  }
  const cdp = await page.context().newCDPSession(page);
  const browserManifest = await cdp.send("Page.getAppManifest");
  expect(browserManifest.errors).toEqual([]);
  expect(new URL(browserManifest.url).pathname).toBe("/assets/web/site.webmanifest");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // Chromium installability eligibility, not merely a parseable manifest.
  await expect.poll(async () => (await cdp.send("Page.getInstallabilityErrors")).installabilityErrors).toEqual([]);

  await page.goto("/ru/practice/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("[data-pattern-list] > a").first()).toBeVisible();
  await page.goto("/en/lens/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("offline shell falls back without replacing an unavailable lesson with stale content", async ({ page, context }) => {
  await page.goto("/en/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.goto("/en/method/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Metkagram is offline" })).toBeVisible();
  await page.goto("/en/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Learn a language through patterns." })).toBeVisible();
  await context.setOffline(false);
});
