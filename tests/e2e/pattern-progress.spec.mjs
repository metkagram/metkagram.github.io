import { expect, test } from "@playwright/test";

const PATTERN_URL = "/ru/practice/patterns/no-matter-how-adj-adv-subject-verb-main-clause-cla002/";
const STORAGE_KEY = "metkagram:pattern-progress:v1";

test("pattern reader keeps a compact browser-local completion marker", async ({ page }) => {
  await page.goto(PATTERN_URL);

  await expect(page.locator("#active-practice")).toHaveCount(0);
  const progress = page.locator("[data-pattern-progress-toggle]");
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-pressed", "false");
  await expect(progress).toHaveText("Отметить пройденным");

  await progress.click();
  await expect(progress).toHaveAttribute("aria-pressed", "true");
  await expect(progress).toHaveText(/Пройдено/);

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(stored.version).toBe(1);
  expect(stored.items.CLA002.completed).toBe(true);

  await page.reload();
  const persistedProgress = page.locator("[data-pattern-progress-toggle]");
  await expect(persistedProgress).toHaveAttribute("aria-pressed", "true");
  await expect(persistedProgress).toHaveText(/Пройдено/);

  await persistedProgress.click();
  await expect(persistedProgress).toHaveAttribute("aria-pressed", "false");
  const cleared = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(cleared.items.CLA002).toBeUndefined();
});
