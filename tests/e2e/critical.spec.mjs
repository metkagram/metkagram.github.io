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

test("root opens the redesigned localized home", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("body")).toHaveClass(/home-studio/);
  await expect(page.getByRole("heading", { name: "Learn a language through patterns." })).toBeVisible();
});

test("home keeps the interface switch and presents one unified annotation studio", async ({ page }, testInfo) => {
  await page.goto("/en/");
  const wordmark = page.locator(".site-header .wordmark");
  await expect(wordmark.locator("img")).toHaveAttribute("src", "/assets/logo/metkagram-logo-dark.svg");
  await expect(wordmark.locator(".wordmark-name")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "RU", exact: true })).toBeVisible();
  await expect(page.locator(".annotation-sheet")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Mark what matters." })).toBeVisible();
  await expect(page.locator(".studio-token-grid .grammar-tag")).toHaveCount(4);
  await expect(page.locator(".studio-pattern-row")).toHaveCount(4);
  await expect(page.locator(".studio-uses").getByRole("link", { name: /Learn/ })).toHaveAttribute("href", "/en/explore/");
  await expect(page.locator(".studio-uses").getByRole("link", { name: /Analyse/ })).toHaveAttribute("href", "/en/practice/");
  await expect(page.locator(".studio-uses").getByRole("link", { name: /Agents/ })).toHaveAttribute("href", "/en/ai/");
  if (testInfo.project.name === "desktop") {
    const layout = await page.locator(".studio-board").evaluate((board) => ({
      titleSize: Number.parseFloat(getComputedStyle(document.querySelector(".studio-copy h1")).fontSize),
      backdrop: getComputedStyle(document.querySelector(".studio-backdrop")).display
    }));
    expect(layout.backdrop).not.toBe("none");
    expect(layout.titleSize).toBeGreaterThan(60);
  }
});

test("method page explains the learning loop and names its research sources", async ({ page }) => {
  await page.goto("/en/method/");
  await expect(page.locator(".site-header .wordmark img")).toHaveAttribute("src", "/assets/logo/metkagram-logo-light.svg");
  await expect(page.getByRole("heading", { name: "Sentence → Signal → Structure → Pattern → Variation → Recall" })).toBeVisible();
  await expect(page.getByText("A research-oriented, NLP-ready foundation strengthens the method")).toBeVisible();
  await expect(page.getByRole("link", { name: /Karpicke \(2020\)/ })).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/33006925/");
});

test("articles and study sets provide compact sharing and printing controls", async ({ page }) => {
  await page.goto("/en/method/");
  const share = page.locator("[data-share-bar]");
  await expect(share).toBeVisible();
  await expect(share.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", /t\.me\/share\/url/);
  await expect(share.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", /linkedin\.com\/sharing\/share-offsite/);
  await expect(share.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me\/\?text=/);
  await expect(share.getByRole("link", { name: "X" })).toHaveAttribute("href", /x\.com\/intent\/post/);
  await expect(share.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(share.getByRole("button", { name: "Print page" })).toBeVisible();
  await page.goto("/en/practice/sets/argumentation/");
  await expect(page.locator("[data-share-bar]").getByRole("button", { name: "Print page" })).toBeVisible();
});

test("mobile app history points learners to the current web workspace", async ({ page }) => {
  await page.goto("/en/apps/");
  await expect(page.getByRole("heading", { name: "The mobile app became a research stage." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pattern Lens" })).toHaveAttribute("href", "/en/lens/");
  await expect(page.getByRole("link", { name: "Pattern Practice" }).first()).toHaveAttribute("href", "/en/practice/");
  await expect(page.getByRole("link", { name: "Project history" })).toHaveAttribute("href", "/en/history/");
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
  const tag = page.locator(".annotation-row").first().locator("[data-tag-trigger]").first();
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
  expect(await rows.count()).toBeGreaterThan(3000);
  await expect(page.locator("[data-study-set-card]")).toHaveCount(0);
  await expect(page.locator(".study-dashboard")).toHaveCount(0);
  await page.locator('[data-category-filter]').selectOption("HED");
  await expect(page.locator("[data-pattern-list] > a:visible")).toHaveCount(40);
  await page.locator('[data-pattern-list] > a:visible').first().click();
  await expect(page).toHaveURL(/\/en\/practice\/patterns\/[^/]+-c1hed001\/$/);
  await expect(page.locator(".pattern-comparison-list li")).toHaveCount(12);
  await page.goto("/en/practice/");
  await page.locator('[data-language-filter="de"]').click();
  const visible = page.locator("[data-pattern-list] > a:visible");
  await expect(visible).not.toHaveCount(0);
  await expect(visible.first()).toHaveAttribute("data-language", /en/);
  await page.locator("[data-pattern-search]").fill("would");
  await expect(page.locator("[data-pattern-count]")).toHaveText(/Showing \d+ patterns/);
});

test("German annotated texts preserve gender and past-tense signals", async ({ page }) => {
  await page.goto("/en/explore/german/dialogues/hgq8uVS1vaEM9KsnC8zC/");
  await expect(page.locator(".gender-mark").first()).toBeVisible();
  await expect(page.locator(".tense-past").first()).toBeVisible();
  await expect(page.locator(".annotation-row")).not.toHaveCount(0);
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
