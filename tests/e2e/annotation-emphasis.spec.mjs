import { test, expect } from '@playwright/test';

test('refreshed EN/DE emphasis remains readable and grammar help works at viewport edges', async({page})=>{
 await page.goto('/en/practice/c1arg001/');
 for(const language of ['en','de']){
  const sentence=page.locator(`.pattern-primary-example [lang="${language}"] p`);
  await expect(sentence.locator('.emphasis-target').first()).toBeVisible();
  await expect(sentence.locator('.emphasis-predicate').first()).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const ids=await page.locator('[role="tooltip"]').evaluateAll(nodes=>nodes.map(n=>n.id));
 expect(new Set(ids).size).toBe(ids.length);
 const tags=page.locator('.pattern-primary-example [data-tag-trigger]');
 const tag=tags.last();await tag.scrollIntoViewIfNeeded();await tag.click();
 await expect(tag).toHaveAttribute('aria-expanded','true');
 await expect(tag.locator('[role="tooltip"]')).toBeVisible();
 const box=await tag.locator('[role="tooltip"]').boundingBox();
 expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width);
 await page.keyboard.press('Escape');await expect(tag).toHaveAttribute('aria-expanded','false');
});
