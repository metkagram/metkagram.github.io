import { expect, test } from "@playwright/test";

test("English and Russian interfaces stay separate and locale switch preserves context", async ({ page }) => {
  await page.goto("/en/explore/german/dialogues/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Dialogues");
  await page.getByRole("link", { name: "RU", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/explore\/german\/dialogues\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Диалоги");
});

test("home keeps the interface switch in the header and leads into a study language", async ({ page }, testInfo) => {
  await page.goto("/en/");
  await expect(page.getByRole("link", { name: "RU", exact: true })).toBeVisible();
  await expect(page.locator(".annotation-sheet")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Choose a language to study", exact: true })).toHaveAttribute("href", "/en/explore/");
  await expect(page.getByRole("link", { name: /EN English 919 sets/ })).toHaveAttribute("href", "/en/explore/english/");
  if (testInfo.project.name === "desktop") {
    const layout = await page.locator(".home-method ol").evaluate((list) => ({
      columns: getComputedStyle(list).gridTemplateColumns.split(" ").length,
      titleSize: Number.parseFloat(getComputedStyle(document.querySelector(".home-intro h1")).fontSize)
    }));
    expect(layout.columns).toBe(2);
    expect(layout.titleSize).toBeLessThan(90);
  }
});

test("method page explains the learning loop and names its research sources", async ({ page }) => {
  await page.goto("/en/method/");
  await expect(page.getByRole("heading", { name: "Sentence → Signal → Structure → Pattern → Variation → Recall" })).toBeVisible();
  await expect(page.getByText("These mechanisms support the design logic")).toBeVisible();
  await expect(page.getByRole("link", { name: /Karpicke \(2020\)/ })).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/33006925/");
});

test("mobile app and legal pages expose store and policy links", async ({ page }) => {
  await page.goto("/en/apps/");
  await expect(page.getByRole("heading", { name: "The original practice apps." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Google Play" })).toHaveAttribute("href", "https://play.google.com/store/apps/details?id=app.metkagram.android");
  await expect(page.getByRole("link", { name: "App Store" })).toHaveAttribute("href", "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918");
  await page.getByRole("link", { name: "Privacy Policy" }).first().click();
  await expect(page).toHaveURL(/\/en\/legal\/privacy\/$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
});

test("grammar tags expose a readable rule on click and keyboard focus", async ({ page }) => {
  await page.goto("/en/explore/english/dialogues/iglIrNfAke7r4OZ0KxuB/");
  const tag = page.locator('[aria-describedby="tag-rule-1-S-1"]');
  await expect(tag).toHaveAttribute("aria-expanded", "false");
  await tag.focus();
  await expect(tag.locator("[role=tooltip]")).toContainText("The main actor or receiver in the sentence.");
  await tag.click();
  await expect(tag).toHaveAttribute("aria-expanded", "true");
  await expect(tag.locator("[role=tooltip]")).toContainText("Use it to find who or what the sentence is about.");
});

test("English and German practice filters work", async ({ page }) => {
  await page.goto("/en/practice/");
  const rows = page.locator("[data-pattern-list] > a");
  await expect(rows).toHaveCount(236);
  await page.locator('[data-language-filter="de"]').click();
  const visible = page.locator("[data-pattern-list] > a:visible");
  await expect(visible).not.toHaveCount(0);
  await expect(visible.first()).toHaveAttribute("data-language", /en/);
  await page.locator("[data-pattern-search]").fill("would");
  await expect(page.locator("[data-pattern-count]")).toHaveText("Showing 7 patterns");
});

test("review queue saves an SRS result", async ({ page }) => {
  await page.goto("/en/review/");
  await expect(page.locator("[data-review-title]")).not.toBeEmpty();
  await page.locator("[data-reveal]").click();
  await page.locator('[data-grade="1"]').click();
  const stored = await page.evaluate(() => localStorage.getItem("metkagram:progress:v2"));
  expect(stored).toContain('"reps":1');
});

test("progress page renders stored statistics", async ({ page }) => {
  await page.goto("/en/progress/");
  await page.evaluate(() => {
    const state = { id: "CON001", reps: 1, ease: 2.5, interval: 1, last: Date.now(), next: Date.now() + 86400000, history: [{ t: Date.now(), grade: 1 }] };
    localStorage.setItem("metkagram:progress:v2", JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), records: { CON001: state } }));
  });
  await page.reload();
  await expect(page.locator("[data-stat-reviewed]")).toHaveText("1");
  await expect(page.locator("[data-progress-rows] tr")).toHaveCount(1);
});

test("mobile navigation opens and keyboard focus is visible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/ru/");
  const menu = page.locator("[data-menu-toggle]");
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator("#site-nav")).toHaveAttribute("data-open", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
