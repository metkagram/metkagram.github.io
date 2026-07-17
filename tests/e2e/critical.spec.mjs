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

test("root landing starts with a phrase-first title instead of an annotated sample", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Language lives in phrases." })).toBeVisible();
  await expect(page.locator(".gateway .sentence-stage")).toHaveCount(0);
  await expect(page.locator(".gateway-sentence p")).toHaveAttribute("aria-label", "I want to make this phrase mine.");
  await expect(page.getByRole("link", { name: /Русский/ })).toHaveAttribute("href", "/ru/");
});

test("home keeps the interface switch and makes both learning modes explicit", async ({ page }, testInfo) => {
  await page.goto("/en/");
  await expect(page.getByRole("link", { name: "RU", exact: true })).toBeVisible();
  await expect(page.locator(".annotation-sheet")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Annotated Language", exact: true }).first()).toHaveAttribute("href", "/en/explore/");
  await expect(page.getByRole("link", { name: "Open Pattern Practice", exact: true }).first()).toHaveAttribute("href", "/en/practice/");
  await expect(page.getByRole("link", { name: /EN English 919 sets/ })).toHaveAttribute("href", "/en/explore/english/");
  await expect(page.getByRole("heading", { name: "Open to thoughtful collaborations." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact the project team" })).toHaveAttribute("href", "https://www.linkedin.com/company/metalhatscats");
  await expect(page.locator(".home-store-links").getByRole("link", { name: "Google Play" })).toHaveAttribute("href", "https://play.google.com/store/apps/details?id=app.metkagram.android");
  await expect(page.locator(".home-store-links").getByRole("link", { name: "App Store" })).toHaveAttribute("href", "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918");
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

test("articles provide compact social sharing controls", async ({ page }) => {
  await page.goto("/en/method/");
  const share = page.locator("[data-share-bar]");
  await expect(share).toBeVisible();
  await expect(share.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", /t\.me\/share\/url/);
  await expect(share.getByRole("link", { name: "VK" })).toHaveAttribute("href", /vk\.com\/share\.php/);
  await expect(share.getByRole("link", { name: "X" })).toHaveAttribute("href", /x\.com\/intent\/post/);
  await expect(share.getByRole("button", { name: "Copy link" })).toBeVisible();
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

test("document reading mode can reveal explanations for the whole set", async ({ page }) => {
  await page.goto("/ru/explore/german/dialogues/hgq8uVS1vaEM9KsnC8zC/");
  const details = page.locator("[data-annotation-details]");
  await expect(details.first()).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Показать разбор" }).click();
  await expect(details).toHaveCount(11);
  await expect(details.first()).toHaveAttribute("open", "");
  await expect(details.nth(10)).toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Читать фразы" }).click();
  await expect(details.first()).not.toHaveAttribute("open", "");
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

test("pattern catalogue opens every pattern directly and filters all patterns", async ({ page }) => {
  await page.goto("/en/practice/");
  const rows = page.locator("[data-pattern-list] > a");
  await expect(rows).toHaveCount(3436);
  await expect(page.locator("[data-study-set-card]")).toHaveCount(0);
  await expect(page.locator(".study-dashboard")).toHaveCount(0);
  await page.locator('[data-category-filter]').selectOption("HED");
  await expect(page.locator("[data-pattern-list] > a:visible")).toHaveCount(40);
  await page.locator('[data-pattern-list] > a:visible').first().click();
  await expect(page).toHaveURL(/\/en\/practice\/c1hed001\/$/);
  await expect(page.locator(".example-list li")).toHaveCount(24);
  await page.goto("/en/practice/");
  await page.locator('[data-language-filter="de"]').click();
  const visible = page.locator("[data-pattern-list] > a:visible");
  await expect(visible).not.toHaveCount(0);
  await expect(visible.first()).toHaveAttribute("data-language", /en/);
  await page.locator("[data-pattern-search]").fill("would");
  await expect(page.locator("[data-pattern-count]")).toHaveText(/Showing \d+ patterns/);
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
