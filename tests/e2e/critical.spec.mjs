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

test("root remains a crawlable multilingual entity gateway", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Metkagram." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in English" })).toHaveAttribute("href", "/en/");
  await expect(page.getByRole("link", { name: "Открыть на русском" })).toHaveAttribute("href", "/ru/");
  await expect(page.getByRole("link", { name: "Method" })).toHaveAttribute("href", "/en/method/");
  await expect(page.getByRole("link", { name: "Research" })).toHaveAttribute("href", "/en/research/");
  await expect(page.getByRole("link", { name: "Cite" })).toHaveAttribute("href", "/en/cite/");
  await expect(page.getByRole("link", { name: "Repository" })).toHaveAttribute("href", "https://github.com/metkagram/metkagram.github.io");
});

test("home keeps the interface switch and leads with the pattern library flow", async ({ page }) => {
  await page.goto("/en/");
  const wordmark = page.locator(".site-header .wordmark");
  await expect(wordmark.locator("img")).toHaveAttribute("src", "/assets/logo/metkagram-logo-dark.svg");
  await expect(wordmark.locator(".wordmark-name")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "RU", exact: true })).toBeVisible();
  await expect(page.locator(".annotation-sheet")).toHaveCount(0);
  const libraryEntry = page.locator('[data-product-entry="library"]');
  await expect(libraryEntry).toBeVisible();
  await expect(libraryEntry).toContainText("Open the pattern library");
  await expect(libraryEntry).toHaveAttribute("href", "/en/practice/");
  await expect(page.locator(".home-example-cue")).toContainText("Если бы у меня было больше времени");
  await expect(page.locator(".home-example-sentence .annotated-token").first()).toBeVisible();
  await expect(page.locator(".home-pattern-list a").first()).toBeVisible();
  await expect(page.locator(".studio-board")).toHaveCount(0);
});

test("method page explains the learning loop and names its research sources", async ({ page }) => {
  await page.goto("/en/method/");
  await expect(page.locator(".site-header .wordmark img")).toHaveAttribute("src", "/assets/logo/metkagram-logo-light.svg");
  await expect(page.getByRole("heading", { name: "Sentence → Tag → Structure → Pattern → Variation → Recall" })).toBeVisible();
  await expect(page.getByText("Principles behind the method")).toBeVisible();
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

test("pattern catalogue searches everything, paginates and restores context", async ({ page }) => {
  await page.goto("/en/practice/");
  const rows = page.locator("[data-pattern-list] > a");
  await expect(rows).toHaveCount(30);
  await expect(page.locator("[data-study-set-card]")).toHaveCount(0);
  await expect(page.locator(".study-dashboard")).toHaveCount(0);
  await expect(page.locator("#study-sets a").first()).toBeVisible();
  await page.locator("[data-pattern-search]").fill("would");
  await expect(page.locator("[data-pattern-count]")).toHaveText(/Showing \d+ patterns/);
  const results = page.locator("[data-pattern-list] > a");
  expect(await results.count()).toBeGreaterThan(0);
  expect(await results.count()).toBeLessThanOrEqual(30);
  await expect(results.first()).toContainText(/would/i);
  await page.locator("[data-pattern-search]").fill("");
  await page.locator("[data-pattern-pagination] button").nth(1).click();
  await expect(page.locator("[data-pattern-page-info]")).toHaveText(/Page 2 of \d+/);
  await page.locator("[data-pattern-list] > a").first().click();
  await expect(page).toHaveURL(/\/en\/practice\/patterns\/[^/]+\/$/);
  await expect(page.locator("[data-pattern-review]")).toBeVisible();
  await page.goBack();
  await expect(page.locator("[data-pattern-page-info]")).toHaveText(/Page 2 of \d+/);
});

test("trilingual review reveals cue, English with annotations, then German", async ({ page }) => {
  await page.goto("/en/practice/patterns/i-can-confirm-that-we-will-act-if-the-team-needs-funcmt021/");
  const review = page.locator("[data-pattern-review]");
  await expect(review).toBeVisible();
  const first = review.locator("[data-review-card]").first();
  await expect(first.locator(".review-cue p")).toBeVisible();
  await expect(first.locator('[data-review-answer="en"]')).toBeHidden();
  await expect(first.locator('[data-review-answer="de"]')).toBeHidden();
  const advance = first.locator("[data-review-advance]");
  await expect(advance).toHaveText("Show English");
  await advance.click();
  await expect(first.locator('[data-review-answer="en"]')).toBeVisible();
  await expect(first.locator('[data-review-answer="en"] .annotated-token').first()).toBeVisible();
  await expect(first.locator('[data-review-answer="de"]')).toBeHidden();
  await expect(advance).toHaveText("Show German");
  await advance.click();
  await expect(first.locator('[data-review-answer="en"]')).toBeVisible();
  await expect(first.locator('[data-review-answer="de"]')).toBeVisible();
  await expect(first.locator('[data-review-answer="de"] .annotated-token').first()).toBeVisible();
  await expect(advance).toHaveText("Next example");
  await advance.click();
  const second = review.locator("[data-review-card]").nth(1);
  await expect(second).toBeVisible();
  await expect(first).toBeHidden();
  await expect(second.locator('[data-review-answer="en"]')).toBeHidden();
  await expect(page.locator(".pattern-full .pattern-comparison-list li")).toHaveCount(10);
});

test("unpaired examples skip the missing language without an error state", async ({ page }) => {
  await page.goto("/en/practice/patterns/i-would-recommend-checking-whether-the-team-funadv001/");
  const card = page.locator('[data-review-card][data-stages="cue en"]').first();
  await card.locator("[data-review-show-all]").click();
  await expect(card.locator('[data-review-answer="en"]')).toBeVisible();
  await expect(card.locator('[data-review-missing="de"]')).toBeVisible();
  await expect(card.locator('[data-review-missing="de"]')).toContainText("no German version");
});

test("pattern review shows every language version without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/en/practice/patterns/i-can-confirm-that-we-will-act-if-the-team-needs-funcmt021/");
  const answers = page.locator("[data-pattern-review] [data-review-answer]");
  expect(await answers.count()).toBeGreaterThan(4);
  await expect(answers.first()).toBeVisible();
  const first = page.locator("[data-pattern-review] [data-review-card]").first();
  await expect(first.locator(".review-cue p")).toBeVisible();
  await expect(page.locator("[data-pattern-review] [data-review-answer='en']").first()).toBeVisible();
  await expect(page.locator("[data-pattern-review] [data-review-answer='de']").first()).toBeVisible();
  await context.close();
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
