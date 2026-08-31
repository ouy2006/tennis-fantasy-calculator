const { test, expect } = require('@playwright/test');
const { fileUrl } = require('../helpers/paths');

test('S-32 · tests.html의 TC-01~TC-24가 모두 통과한다', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (caught) => errors.push(caught.message));
  await page.goto(fileUrl('tests.html'));
  const summary = page.locator('#summary');
  await expect(summary).toHaveAttribute('data-failed', '0');
  const values = await summary.evaluate((element) => ({
    pass: element.dataset.pass,
    total: element.dataset.total,
    ids: element.dataset.tcIds.split(',')
  }));
  expect(values.pass).toBe(values.total);
  expect(new Set(values.ids)).toEqual(new Set(Array.from({ length: 24 }, (_, index) => `TC-${String(index + 1).padStart(2, '0')}`)));
  expect(errors).toEqual([]);
  await page.screenshot({ path: require('path').resolve(__dirname, '..', 'screenshots', 'S-32.png'), fullPage: true });
});
