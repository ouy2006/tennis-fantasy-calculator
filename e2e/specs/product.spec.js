const { test, expect } = require('@playwright/test');
const { fileUrl, PRODUCT_ROOT } = require('../helpers/paths');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
const PRODUCT_FILES = ['index.html', 'calc.js', 'prices.js', 'holidays.js', 'tests.html', 'README.md'];
// 기본 시나리오용 반포점 상품: 30분 · 1:1 · 평일 (주1·2·3회 240,000 / 440,000 / 600,000원)
const PRODUCT = 'l30-1v1-weekday';
const OTHER_PRODUCT = 'l20-1v1-weekday';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const unexpectedBrowserErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  unexpectedBrowserErrors.set(page, errors);
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (caught) => errors.push(`pageerror: ${caught.message}`));
});

test.afterEach(async ({ page }, testInfo) => {
  const match = testInfo.title.match(/S-\d{2}/);
  if (!match || page.isClosed()) return;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${match[0]}.png`), fullPage: true });
  expect(unexpectedBrowserErrors.get(page) || []).toEqual([]);
});

async function gotoApp(page, targetUrl = fileUrl('index.html')) {
  const browserErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (caught) => browserErrors.push(caught.message));
  await page.goto(targetUrl);
  return browserErrors;
}

async function setMonth(page, month) {
  await page.locator('#target-month').fill(month);
  await page.locator('#target-month').dispatchEvent('change');
}

async function selectConditions(page, options = {}) {
  const settings = Object.assign({
    month: '2026-08', branch: 'banpo', product: PRODUCT, frequency: 2, days: [2, 4]
  }, options);
  if (settings.month) await setMonth(page, settings.month);
  await page.locator(`[data-branch="${settings.branch}"]`).click();
  await page.locator('#product-select').selectOption(settings.product);
  await page.locator(`[data-frequency="${settings.frequency}"]`).click();
  for (const day of settings.days) await page.locator(`[data-day="${day}"]`).click();
  await expect(page.locator('#result-content')).toBeVisible();
}

async function commitAmount(page, selector, amount) {
  await page.locator(selector).fill(String(amount));
  await page.locator(selector).press('Enter');
}

async function addAdjustment(page, date, type) {
  await page.locator('#adjust-date').fill(date);
  await page.locator(type === 'include' ? '#add-inclusion' : '#add-exclusion').click();
}

async function selectHoliday(page, date) {
  const choice = page.locator(`[data-holiday-choice="${date}"]`);
  await expect(choice).toBeVisible();
  await choice.check();
}

function createVariant(changes) {
  const e2eRoot = path.resolve(__dirname, '..');
  const tempRoot = fs.mkdtempSync(path.join(e2eRoot, 'tmp-app-'));
  for (const name of PRODUCT_FILES) fs.copyFileSync(path.join(PRODUCT_ROOT, name), path.join(tempRoot, name));
  for (const [name, content] of Object.entries(changes)) {
    const destination = path.resolve(tempRoot, name);
    if (!destination.startsWith(tempRoot + path.sep)) throw new Error('임시 파일 경로가 범위를 벗어났습니다.');
    if (content === null) fs.rmSync(destination);
    else fs.writeFileSync(destination, content, 'utf8');
  }
  return tempRoot;
}

function removeVariant(tempRoot) {
  const e2eRoot = path.resolve(__dirname, '..');
  const resolved = path.resolve(tempRoot);
  if (!resolved.startsWith(e2eRoot + path.sep) || !path.basename(resolved).startsWith('tmp-app-')) throw new Error('삭제할 임시 경로가 안전하지 않습니다.');
  fs.rmSync(resolved, { recursive: true, force: true });
}

test('S-01 · 페이지 최초 로드', async ({ page }) => {
  const errors = await gotoApp(page);
  await expect(page.locator('#empty-state')).toContainText('왼쪽에서 계산 조건을 선택해 주세요.');
  await expect(page.locator('#result-content')).toBeHidden();
  await expect(page.locator('body')).not.toContainText(/^0원$/);
  expect(errors).toEqual([]);
});

test('S-02 · 2026-09 반포점 주2회 화·목 기본 계산', async ({ page }) => {
  await gotoApp(page);
  await page.evaluate(() => { HOLIDAY_DATA.years['2026'] = []; });
  await selectConditions(page, { month:'2026-09', frequency:2, days:[2,4] });
  await expect(page.locator('#final-fee-display')).toBeVisible();
  await expect(page.locator('#valid-count')).toHaveText('9회');
  await expect(page.locator('[data-notice-code="N-OVER-BASE"]')).toContainText('5주차 포함');
});

test('S-03 · 헤더 데이터 메타 정보', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[data-branch="banpo"]').click();
  await expect(page.locator('#price-meta')).toContainText('가격표 시행일: 2026-07-06');
  await expect(page.locator('#holiday-meta')).toContainText('2026·2027년');
});

test('S-04 · 주2회인데 요일 1개', async ({ page }) => {
  await gotoApp(page);
  await setMonth(page, '2026-09');
  await page.locator('[data-branch="banpo"]').click();
  await page.locator('#product-select').selectOption(PRODUCT);
  await page.locator('[data-frequency="2"]').click();
  await page.locator('[data-day="2"]').click();
  await expect(page.locator('#weekday-error')).toHaveText('주 2회 수업은 요일 2개를 선택해야 합니다.');
  await expect(page.locator('#result-content')).toBeHidden();
});

test('S-05 · 요일 개수 도달 시 나머지 잠금', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  await expect(page.locator('[data-day="1"]')).toBeDisabled();
  await expect(page.locator('[data-day="2"]')).toBeEnabled();
  await page.locator('[data-day="2"]').click();
  await expect(page.locator('[data-day="1"]')).toBeEnabled();
});

test('S-06 · 평일 상품의 주말 요일 제한', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[data-branch="banpo"]').click();
  await page.locator('#product-select').selectOption(PRODUCT);
  await page.locator('[data-frequency="2"]').click();
  await expect(page.locator('[data-day="6"]')).toBeDisabled();
  await expect(page.locator('[data-day="0"]')).toBeDisabled();
});

test('S-07 · 주3회에서 주2회 축소', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:3, days:[1,2,3] });
  await page.locator('[data-frequency="2"]').click();
  await expect(page.locator('[data-day][aria-pressed="true"]')).toHaveCount(2);
  await expect(page.locator('[data-notice-code="N-WEEKDAY-TRIMMED"]')).toContainText('자동 해제');
});

test('S-08 · 지점 전환 시 가격 격리', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await commitAmount(page, '#applied-fee', 123456);
  await page.locator('[data-branch="bangbae"]').click();
  await expect(page.locator('#product-select')).toHaveValue('');
  await page.locator('#product-select').selectOption('1v1-regular');
  await page.locator('[data-frequency="1"]').click();
  await expect(page.locator('#applied-fee')).toHaveValue('180,000');
  await expect(page.locator('#applied-fee')).not.toHaveValue('123,456');
});

test('S-09 · 가격 조합 없음 차단', async ({ page }) => {
  await gotoApp(page);
  await page.evaluate((id) => { PRICE_DATA.branches[0].products.find((product) => product.id === id).monthlyFees['2'] = undefined; }, PRODUCT);
  await page.locator('[data-branch="banpo"]').click();
  await page.locator('#product-select').selectOption(PRODUCT);
  await page.locator('[data-frequency="2"]').click();
  await page.locator('[data-day="2"]').click();
  await page.locator('[data-day="4"]').click();
  await expect(page.locator('#product-error')).toHaveText('선택한 조건의 가격 정보가 없습니다.');
  await expect(page.locator('#result-content')).toBeHidden();
});

test('S-10 · 적용 요금은 blur 또는 Enter에서만 확정', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { month:'2026-08', frequency:1, days:[2] });
  const input = page.locator('#applied-fee');
  await input.fill('265000');
  await expect(page.locator('[data-notice-code="N-PRICE-ADJUSTED"]')).toHaveCount(0);
  await input.press('Enter');
  await expect(page.locator('[data-notice-code="N-PRICE-ADJUSTED"]')).toContainText('가격표 240,000원 → 적용 265,000원 (+25,000원)');
});

test('S-11 · 최종 결제액 조정 후 요일 변경 초기화', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await commitAmount(page, '#final-fee', 111100);
  await page.locator('[data-day="2"]').click();
  await page.locator('[data-day="1"]').click();
  await expect(page.locator('#final-fee')).not.toHaveValue('111,100');
  await expect(page.locator('[data-notice-code="N-ADJUST-RESET"]')).toContainText('최종 결제액');
});

test('S-12 · 회원명 변경은 최종 조정 유지', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await commitAmount(page, '#final-fee', 111100);
  await page.locator('#member-name').fill('김회원');
  await expect(page.locator('#final-fee')).toHaveValue('111,100');
});

test('S-13 · 최종 결제액 0원 조정 유지', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await commitAmount(page, '#final-fee', 0);
  await expect(page.locator('#final-fee')).toHaveValue('0');
  await expect(page.locator('#final-fee-display')).toHaveText('0원');
});

test('S-14 · 휴일 기본 미선택과 사용자가 선택한 일반 공휴일 제외', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { month:'2026-09', days:[2,4] });
  await expect(page.locator('[data-date="2026-09-01"]')).toContainText('●');
  await expect(page.locator('[data-holiday-choice="2026-09-24"]')).not.toBeChecked();
  await expect(page.locator('#valid-count')).toHaveText('9회');
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('미선택');
  await expect(page.locator('[data-date="2026-09-24"]')).not.toContainText('✕');
  await selectHoliday(page, '2026-09-24');
  await expect(page.locator('#valid-count')).toHaveText('8회');
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('✕');
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('추석 연휴');
});

test('S-15 · 수업 요일 아닌 날도 공휴일명 표시', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { month:'2026-08', frequency:1, days:[2] });
  await expect(page.locator('[data-date="2026-08-15"]')).toContainText('광복절');
  await expect(page.locator('[data-date="2026-08-15"]')).not.toContainText('●');
});

test('S-16 · 달력 클릭으로 추가 제외', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  const before = Number((await page.locator('#valid-count').innerText()).replace('회',''));
  await page.locator('[data-date="2026-08-04"]').click();
  await expect(page.locator('#valid-count')).toHaveText(`${before - 1}회`);
  await expect(page.locator('[data-date="2026-08-04"]')).toContainText('⊘');
});

test('S-17 · 일반 공휴일 수동 포함 복구', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { month:'2026-09', frequency:1, days:[4] });
  await selectHoliday(page, '2026-09-24');
  const before = Number((await page.locator('#valid-count').innerText()).replace('회',''));
  await page.locator('[data-date="2026-09-24"]').click();
  await expect(page.locator('#valid-count')).toHaveText(`${before + 1}회`);
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('＋');
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('수업(수동)');
});

test('S-18 · 정규 요일 밖 보강 포함', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  const before = Number((await page.locator('#valid-count').innerText()).replace('회',''));
  await page.locator('[data-date="2026-08-05"]').click();
  await expect(page.locator('#valid-count')).toHaveText(`${before + 1}회`);
  await expect(page.locator('[data-date="2026-08-05"]')).toContainText('＋');
  await expect(page.locator('[data-date="2026-08-05"]')).toContainText('보강');
});

test('S-19 · 같은 날짜 제외와 포함 중복 금지', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await addAdjustment(page, '2026-08-04', 'exclude');
  await addAdjustment(page, '2026-08-04', 'include');
  await expect(page.locator('#adjust-error')).toContainText('이미 등록');
  await expect(page.locator('[data-adjust-date="2026-08-04"]')).toHaveCount(1);
});

test('S-20 · 조정 사유는 내부 문구에만 포함', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  const reports = await page.evaluate(() => {
    const input = {targetMonth:'2026-09',branchId:'banpo',productId:'sample',pricingModel:'monthly4week',weeklyFrequency:2,selectedWeekdays:[2,4],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:200000,appliedMonthlyFee:200000,finalFeeOverride:null,adjustmentReason:'내부 전용 사유'};
    const result = TFCalc.calculate(input,[]);
    const meta = {branchName:'반포점',productLabel:'샘플 상품',effectiveFrom:'2026-01-01',adjustmentReason:'내부 전용 사유'};
    return {internal:TFCalc.buildInternalReport(input,result,meta),member:TFCalc.buildMemberMessage(input,result,meta)};
  });
  expect(reports.internal).toContain('내부 전용 사유');
  expect(reports.member).not.toContain('내부 전용 사유');
});

test('S-21 · 회원명 미입력 회원 안내 문구', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  const text = await page.evaluate(() => TFCalc.buildMemberMessage(window.eval('({targetMonth:"2026-09",branchId:"banpo",productId:"sample",pricingModel:"monthly4week",weeklyFrequency:2,selectedWeekdays:[2,4],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:200000,appliedMonthlyFee:200000,finalFeeOverride:null})'),TFCalc.calculate(window.eval('({targetMonth:"2026-09",branchId:"banpo",productId:"sample",pricingModel:"monthly4week",weeklyFrequency:2,selectedWeekdays:[2,4],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:200000,appliedMonthlyFee:200000,finalFeeOverride:null})'),[]),{branchName:'반포점',productLabel:'샘플'}));
  expect(text).toContain('회원님의 2026년 9월');
});

test('S-22 · 5주차 회원 안내 문구', async ({ page }) => {
  await gotoApp(page);
  const text = await page.evaluate(() => {
    const input={targetMonth:'2026-09',branchId:'banpo',productId:'sample',pricingModel:'monthly4week',weeklyFrequency:2,selectedWeekdays:[2,4],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:200000,appliedMonthlyFee:200000,finalFeeOverride:null};
    const result=TFCalc.calculate(input,[]);return TFCalc.buildMemberMessage(input,result,{branchName:'반포점',productLabel:'샘플'});
  });
  expect(text).toContain('5주차가 포함되어 기준 8회보다 1회 많습니다.');
});

test('S-23 · 복사 버튼 실제 클릭', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  await page.locator('#copy-internal').click();
  await expect(page.locator('#copy-status')).toContainText(/복사했습니다|직접 복사/);
});

test('S-24 · 공휴일 데이터 없는 연도', async ({ page }) => {
  await gotoApp(page);
  await setMonth(page, '2030-01');
  await expect(page.locator('#holiday-year-message')).toContainText('2030년 공휴일 데이터가 없습니다');
  await expect(page.locator('#result-content')).toBeHidden();
  await page.locator('#ignore-holidays').check();
  await page.locator('[data-branch="banpo"]').click();
  await page.locator('#product-select').selectOption(PRODUCT);
  await page.locator('[data-frequency="1"]').click();
  await page.locator('[data-day="2"]').click();
  await expect(page.locator('[data-notice-code="N-NO-HOLIDAY-DATA"]')).toContainText('2030년 공휴일 데이터 없이');
  const reports = await page.evaluate(() => {
    const input={targetMonth:'2030-01',branchId:'banpo',productId:'sample',pricingModel:'monthly4week',weeklyFrequency:1,selectedWeekdays:[2],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:200000,appliedMonthlyFee:200000,finalFeeOverride:null,noHolidayData:true};
    const result=TFCalc.calculate(input,[]);const meta={branchName:'반포점',productLabel:'샘플',noHolidayData:true};return [TFCalc.buildInternalReport(input,result,meta),TFCalc.buildMemberMessage(input,result,meta)];
  });
  expect(reports[0]).toContain('2030년 공휴일 데이터 없이');
  expect(reports[1]).toContain('공휴일 반영 전 안내입니다');
});

test('S-25 · 회원명 XSS 입력 방어', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  const payload = '<img src=x onerror="window.__xss=1">';
  await page.locator('#member-name').fill(payload);
  await expect(page.locator('#member-name')).toHaveValue(payload);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test('S-26 · 조정 사유 XSS 입력 방어', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page);
  const payload = '<img src=x onerror="window.__xss=1">';
  await page.locator('#adjustment-reason').fill(payload);
  await expect(page.locator('#reason-text')).toHaveText(payload);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test('S-27 · 예정 수업일 전부 제외 시 0원', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  const dates = await page.locator('[data-calendar-state="normal-class"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.date));
  for (const date of dates) await page.locator(`[data-date="${date}"]`).click();
  await expect(page.locator('#valid-count')).toHaveText('0회');
  await expect(page.locator('#final-fee-display')).toHaveText('0원');
  await expect(page.locator('#error-summary')).toBeHidden();
});

test('S-28 · 다음 회원은 개인 값만 초기화', async ({ page }) => {
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await selectHoliday(page, '2026-08-17');
  await addAdjustment(page,'2026-08-04','exclude');
  await page.locator('#member-name').fill('홍길동');
  await page.locator('#adjustment-reason').fill('개별 사유');
  await commitAmount(page,'#applied-fee',180000);
  await commitAmount(page,'#final-fee',170000);
  await page.locator('#next-member').click();
  await expect(page.locator('#member-name')).toHaveValue('');
  await expect(page.locator('#adjustment-reason')).toHaveValue('');
  await expect(page.locator('#target-month')).toHaveValue('2026-08');
  await expect(page.locator('[data-branch="banpo"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#product-select')).toHaveValue(PRODUCT);
  await expect(page.locator('[data-holiday-choice="2026-08-17"]')).toBeChecked();
  await expect(page.locator('[data-adjust-date="2026-08-04"]')).toHaveCount(1);
  await expect(page.locator('#applied-fee')).toHaveValue('240,000');
  await expect(page.locator('#member-name')).toBeFocused();
});

test('S-29 · 키보드만으로 주요 흐름 조작', async ({ page }) => {
  await gotoApp(page);
  await setMonth(page,'2026-08');
  await page.locator('[data-branch="banpo"]').focus(); await page.keyboard.press('Space');
  await page.locator('#product-select').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await page.locator('[data-frequency="1"]').focus(); await page.keyboard.press('Space');
  await page.locator('[data-day="2"]').focus(); await page.keyboard.press('Space');
  await expect(page.locator('#result-content')).toBeVisible();
  await page.locator('[data-date="2026-08-04"]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-date="2026-08-04"]')).toContainText('⊘');
  await page.locator('#copy-member').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#copy-status')).not.toHaveText('');
});

test('S-30 · 375px 모바일 1열과 무가로스크롤', async ({ page }) => {
  await page.setViewportSize({width:375,height:812});
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  const metrics = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,columns:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length}));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.columns).toBe(1);
  await expect(page.locator('#copy-member')).toBeVisible();
});

test('S-31 · 오프라인 file 환경과 외부 요청 0건', async ({ page, context }) => {
  const externalRequests=[];
  page.on('request',(request)=>{if(/^(https?|wss?):/.test(request.url()))externalRequests.push(request.url());});
  await context.setOffline(true);
  await gotoApp(page);
  await selectConditions(page, { frequency:1, days:[2] });
  await expect(page.locator('#result-content')).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('S-33 · 손상된 prices.js 복사본 차단', async ({ page }) => {
  const tempRoot=createVariant({'prices.js':'const PRICE_DATA = { schemaVersion: 999 };'});
  try {
    await gotoApp(page, require('url').pathToFileURL(path.join(tempRoot,'index.html')).href);
    await expect(page.locator('#error-summary')).toContainText('가격표 형식이 올바르지 않습니다');
    await expect(page.locator('#result-content')).toBeHidden();
    await expect(page.locator('#final-fee-display')).toBeHidden();
  } finally { removeVariant(tempRoot); }
});

test('S-34 · 차단 오류 코드 16개 전수', async ({ page }) => {
  test.setTimeout(60000);
  const observed = new Set();
  const dataCases = [
    ['E-DATA-PRICE-LOAD', {'prices.js':"(window.__tfLoadErrors||(window.__tfLoadErrors=[])).push('prices.js');"}],
    ['E-DATA-PRICE-SCHEMA', {'prices.js':'const PRICE_DATA = { schemaVersion: 999 };'}],
    ['E-DATA-HOLIDAY-LOAD', {'holidays.js':"(window.__tfLoadErrors||(window.__tfLoadErrors=[])).push('holidays.js');"}],
    ['E-DATA-HOLIDAY-SCHEMA', {'holidays.js':'const HOLIDAY_DATA = { schemaVersion: 999 };'}],
    ['E-DATA-CALC-LOAD', {'calc.js':"(window.__tfLoadErrors||(window.__tfLoadErrors=[])).push('calc.js');"}]
  ];
  for (const [code,change] of dataCases) {
    const tempRoot=createVariant(change);
    try {
      await page.goto(require('url').pathToFileURL(path.join(tempRoot,'index.html')).href);
      const codes=await page.locator('#error-summary [data-error-code]').evaluateAll((nodes)=>nodes.map((node)=>node.dataset.errorCode));
      if(codes.includes(code))observed.add(code);
    } finally { removeVariant(tempRoot); }
  }
  await page.goto(fileUrl('index.html'));
  await page.locator('#target-month').fill(''); await page.locator('#target-month').dispatchEvent('change');
  observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await setMonth(page,'2030-01'); observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await setMonth(page,'2026-08'); observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('[data-branch="banpo"]').click(); observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('#product-select').selectOption(PRODUCT); observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('[data-frequency="2"]').click(); await page.locator('[data-day="2"]').click(); observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('[data-day="4"]').click();
  await page.evaluate((id)=>{PRICE_DATA.branches[0].products.find((product)=>product.id===id).monthlyFees['2']=undefined;},PRODUCT);
  await page.locator('[data-day="4"]').click();await page.locator('[data-day="4"]').click();observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.evaluate((id)=>{PRICE_DATA.branches[0].products.find((product)=>product.id===id).monthlyFees['2']=440000;},PRODUCT);
  await page.locator('[data-day="4"]').click();await page.locator('[data-day="4"]').click();
  await page.locator('#applied-fee').fill('0');await page.locator('#applied-fee').press('Enter');observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('#applied-fee').fill('300000');await page.locator('#applied-fee').press('Enter');
  await page.locator('#final-fee').fill('-1');await page.locator('#final-fee').press('Enter');observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('#final-fee').fill('300000');await page.locator('#final-fee').press('Enter');
  await page.locator('#adjust-date').fill('2026-09-01');await page.locator('#add-exclusion').click();observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  await page.locator('#adjust-date').fill('2026-08-04');await page.locator('#add-exclusion').click();await page.locator('#adjust-date').fill('2026-08-04');await page.locator('#add-inclusion').click();observed.add(await page.locator('#error-summary [data-error-code]').first().getAttribute('data-error-code'));
  const expected=['E-DATA-PRICE-LOAD','E-DATA-PRICE-SCHEMA','E-DATA-HOLIDAY-LOAD','E-DATA-HOLIDAY-SCHEMA','E-DATA-CALC-LOAD','E-MONTH','E-HOLIDAY-YEAR','E-BRANCH','E-PRODUCT','E-FREQUENCY','E-WEEKDAYS','E-PRICE-MISSING','E-PRICE-VALUE','E-FINAL-FEE','E-ADJUST-RANGE','E-ADJUST-DUP'];
  expect(observed).toEqual(new Set(expected));
});

test('S-35 · 비차단 안내 코드 16개 전수', async ({ page }) => {
  const observed = new Set();
  const collect=async()=>{for(const code of await page.locator('[data-notice-code]').evaluateAll((nodes)=>nodes.map((node)=>node.dataset.noticeCode)))observed.add(code);};
  await gotoApp(page);await selectConditions(page,{month:'2026-09',frequency:2,days:[2,4]});await selectHoliday(page,'2026-09-24');await collect();
  await page.reload();await selectConditions(page,{month:'2026-08',frequency:1,days:[1]});await selectHoliday(page,'2026-08-17');await collect();
  await addAdjustment(page,'2026-08-03','exclude');await collect();
  await addAdjustment(page,'2026-08-05','include');await collect();
  await addAdjustment(page,'2026-08-06','exclude');await collect();
  await addAdjustment(page,'2026-08-10','include');await collect();
  await addAdjustment(page,'2026-08-17','exclude');await addAdjustment(page,'2026-08-24','exclude');await collect();
  await commitAmount(page,'#applied-fee',200123);await collect();
  await commitAmount(page,'#final-fee',123400);await collect();
  await page.locator('[data-day="1"]').click();await page.locator('[data-day="2"]').click();await collect();
  await page.reload();await selectConditions(page,{month:'2026-08',frequency:2,days:[2,4]});await collect();
  await page.reload();await selectConditions(page,{month:'2026-07',frequency:1,days:[1]});await collect();
  await page.reload();await setMonth(page,'2030-01');await page.locator('#ignore-holidays').check();await page.locator('[data-branch="banpo"]').click();await page.locator('#product-select').selectOption(PRODUCT);await page.locator('[data-frequency="1"]').click();await page.locator('[data-day="2"]').click();await collect();
  await page.reload();await selectConditions(page,{frequency:3,days:[1,2,3]});await page.locator('[data-frequency="2"]').click();await collect();
  const expected=['N-REGULAR-HOLIDAY','N-SPECIAL-HOLIDAY','N-OVER-BASE','N-UNDER-BASE','N-BASE-MATCH','N-ROUNDED','N-MANUAL-EXCLUSION','N-MANUAL-INCLUSION','N-EXCLUSION-NOOP','N-INCLUSION-NOOP','N-NO-HOLIDAY-DATA','N-HOLIDAY-EMPTY','N-PRICE-ADJUSTED','N-FINAL-ADJUSTED','N-ADJUST-RESET','N-WEEKDAY-TRIMMED'];
  expect(observed).toEqual(new Set(expected));
});

test('S-36 · 결과 패널 18개 항목 순서와 접힘', async ({ page }) => {
  await gotoApp(page);await selectConditions(page);
  const orders=await page.locator('[data-result-order]').evaluateAll((nodes)=>nodes.map((node)=>Number(node.dataset.resultOrder)));
  expect(orders).toEqual(Array.from({length:18},(_,index)=>index+1));
  for(let order=10;order<=15;order+=1)await expect(page.locator(`[data-result-order="${order}"]`)).not.toHaveAttribute('open','');
  await expect(page.locator('[data-result-order="5"]')).not.toHaveAttribute('open','');
  await page.locator('[data-result-order="10"] summary').click();await expect(page.locator('[data-result-order="10"]')).toHaveAttribute('open','');
});

test('S-37 · 달력 상태 8종 전수', async ({ page }) => {
  const observed=new Set();const collect=async()=>{for(const value of await page.locator('[data-calendar-state]').evaluateAll((nodes)=>nodes.map((node)=>node.dataset.calendarState)))observed.add(value);};
  await gotoApp(page);await selectConditions(page,{month:'2026-08',frequency:1,days:[1]});await selectHoliday(page,'2026-08-17');await collect();
  await page.locator('[data-date="2026-08-03"]').click();await collect();
  await page.locator('[data-date="2026-08-05"]').click();await collect();
  await page.reload();await selectConditions(page,{month:'2026-09',frequency:1,days:[4]});await selectHoliday(page,'2026-09-24');await collect();
  await page.locator('[data-date="2026-09-24"]').click();await collect();
  expect(observed).toEqual(new Set(['normal-class','regular-excluded','manual-exclude','manual-include-restored','manual-include-makeup','special-class','nonclass-holiday','nonclass-empty']));
  await expect(page.locator('[data-date="2026-09-24"]')).toContainText('＋');
});

test('S-38 · 복사 문구 조건부 줄 9종 양방향', async ({ page }) => {
  await gotoApp(page);
  const checks=await page.evaluate(()=>{
    const base={targetMonth:'2026-08',branchId:'banpo',productId:'sample',pricingModel:'monthly4week',weeklyFrequency:2,selectedWeekdays:[2,4],manualExcludedDates:[],manualIncludedDates:[],baseMonthlyFee:240000,appliedMonthlyFee:240000,finalFeeOverride:null,adjustmentReason:''};
    const meta={branchName:'반포점',productLabel:'샘플',effectiveFrom:'2026-01-01'};
    const normal=TFCalc.calculate(base,[]);const normalI=TFCalc.buildInternalReport(base,normal,meta);const normalM=TFCalc.buildMemberMessage(base,normal,meta);
    const rich=Object.assign({},base,{targetMonth:'2026-09',weeklyFrequency:3,selectedWeekdays:[1,3,5],baseMonthlyFee:250000,appliedMonthlyFee:250001,finalFeeOverride:200000,adjustmentReason:'내부 사유',manualIncludedDates:['2026-09-01','2026-09-22'],noHolidayData:true});
    const holidays=[{date:'2026-09-16',name:'일반',kind:'regular'},{date:'2026-09-23',name:'대체',kind:'substitute'}];
    const richR=TFCalc.calculate(rich,holidays);const richI=TFCalc.buildInternalReport(rich,richR,Object.assign({},meta,{noHolidayData:true,adjustmentReason:'내부 사유'}));const richM=TFCalc.buildMemberMessage(rich,richR,Object.assign({},meta,{noHolidayData:true}));
    return {normalI,normalM,richI,richM};
  });
  const internalTokens=['적용 월 기준 요금:','100원 절사:','조정 최종 수강료:','조정 사유:','공휴일 데이터 없이 계산한 결과입니다'];
  for(const token of internalTokens){expect(checks.richI).toContain(token);expect(checks.normalI).not.toContain(token);}
  const memberTokens=['일반 공휴일 제외:','대체·임시공휴일 정상 수업 포함:','보강 수업 포함:','5주차가 포함되어'];
  for(const token of memberTokens){expect(checks.richM).toContain(token);expect(checks.normalM).not.toContain(token);}
});

test('S-39 · 입력 후 결과 갱신 성능 중앙값 100ms 이내', async ({ page }) => {
  await gotoApp(page);await selectConditions(page,{frequency:1,days:[2]});
  const times=[];
  for(let index=0;index<5;index+=1){
    await page.evaluate(()=>{window.__tfPerfElapsed=null;document.querySelector('[data-day="2"]').addEventListener('click',()=>{const start=performance.now();queueMicrotask(()=>{window.__tfPerfElapsed=performance.now()-start;});},{capture:true,once:true});});
    await page.locator('[data-day="2"]').click();await page.waitForFunction(()=>window.__tfPerfElapsed!==null);times.push(await page.evaluate(()=>window.__tfPerfElapsed));
    await page.evaluate(()=>{window.__tfPerfElapsed=null;document.querySelector('[data-day="2"]').addEventListener('click',()=>{const start=performance.now();queueMicrotask(()=>{window.__tfPerfElapsed=performance.now()-start;});},{capture:true,once:true});});
    await page.locator('[data-day="2"]').click();await page.waitForFunction(()=>window.__tfPerfElapsed!==null);
  }
  times.sort((a,b)=>a-b);expect(times[2]).toBeLessThanOrEqual(100);
  const blurTimes=[];
  for(let index=0;index<5;index+=1){
    await page.locator('#applied-fee').fill(String(200000+index*100));
    await page.evaluate(()=>{window.__tfPerfElapsed=null;document.querySelector('#applied-fee').addEventListener('keydown',(event)=>{if(event.key==='Enter'){const start=performance.now();queueMicrotask(()=>{window.__tfPerfElapsed=performance.now()-start;});}},{capture:true,once:true});});
    await page.locator('#applied-fee').press('Enter');await page.waitForFunction(()=>window.__tfPerfElapsed!==null);blurTimes.push(await page.evaluate(()=>window.__tfPerfElapsed));
  }
  blurTimes.sort((a,b)=>a-b);expect(blurTimes[2]).toBeLessThanOrEqual(100);
});

test('S-40 · 조정값 초기화 트리거 전수', async ({ page }) => {
  test.setTimeout(120000);
  await gotoApp(page);
  const assertFinalReset=async(trigger)=>{await page.reload();await selectConditions(page,{frequency:1,days:[2]});await commitAmount(page,'#final-fee',111100);await trigger();await expect(page.locator('#final-fee')).not.toHaveValue('111,100');};
  await assertFinalReset(()=>setMonth(page,'2026-09'));
  await assertFinalReset(()=>page.locator('[data-branch="bangbae"]').click());
  await assertFinalReset(()=>page.locator('#product-select').selectOption(OTHER_PRODUCT));
  await assertFinalReset(()=>page.locator('[data-frequency="2"]').click());
  await assertFinalReset(async()=>{await page.locator('[data-day="2"]').click();await page.locator('[data-day="1"]').click();});
  await assertFinalReset(()=>addAdjustment(page,'2026-08-04','exclude'));
  await assertFinalReset(()=>commitAmount(page,'#applied-fee',180000));
  await page.reload();await selectConditions(page,{frequency:1,days:[2]});await commitAmount(page,'#applied-fee',180000);await commitAmount(page,'#final-fee',111100);await page.locator('#member-name').fill('이름');await page.locator('#adjustment-reason').fill('사유');await expect(page.locator('#applied-fee')).toHaveValue('180,000');await expect(page.locator('#final-fee')).toHaveValue('111,100');
  const assertAppliedReset=async(trigger)=>{await page.reload();await selectConditions(page,{frequency:1,days:[2]});await commitAmount(page,'#applied-fee',180000);await trigger();await expect(page.locator('#applied-fee')).not.toHaveValue('180,000');};
  await assertAppliedReset(()=>page.locator('[data-branch="bangbae"]').click());
  await assertAppliedReset(()=>page.locator('#product-select').selectOption(OTHER_PRODUCT));
  await assertAppliedReset(()=>page.locator('[data-frequency="2"]').click());
});

test('S-41 · 클립보드 API 실패 시 두 단계 폴백', async ({ page }) => {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('forced'))}});
    const original=document.execCommand.bind(document);window.__originalExec=original;document.execCommand=(command)=>command==='copy';
  });
  await gotoApp(page);await selectConditions(page);
  await page.locator('#copy-internal').click();await expect(page.locator('#copy-status')).toHaveText('복사했습니다.');
  await page.evaluate(()=>{document.execCommand=()=>false;});
  await page.locator('#copy-member').click();await expect(page.locator('#copy-fallback')).toBeVisible();await expect(page.locator('#copy-fallback-text')).not.toHaveValue('');await expect(page.locator('#copy-fallback-text')).toBeFocused();
});

/* ---------- 방배점 2026-10-01 개정 가격표 (방배점 가격표.jpg) ---------- */

// 가격표 이미지에서 직접 옮긴 기대값. prices.js 를 읽지 않고 화면 값과 대조한다.
const BANGBAE_PRICE_LIST = {
  '1v1-regular': { label: '정규레슨 1:1 · 평일&주말', fees: { 1: 180000, 2: 320000, 3: 450000 } },
  '2v1-regular': { label: '정규레슨 2:1 · 평일&주말 · 1인', fees: { 1: 140000, 2: 240000, 3: 330000 } }
};
const BANGBAE_DISCOUNTS = { 1: 0, 2: 5, 3: 10 };
const won = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

async function selectBangbae(page, options = {}) {
  const settings = Object.assign({ month: '2026-10', product: '1v1-regular', frequency: 2, days: [2, 6] }, options);
  await setMonth(page, settings.month);
  await page.locator('[data-branch="bangbae"]').click();
  await page.locator('#product-select').selectOption(settings.product);
  await page.locator(`[data-frequency="${settings.frequency}"]`).click();
  for (const day of settings.days) await page.locator(`[data-day="${day}"]`).click();
  await expect(page.locator('#result-content')).toBeVisible();
}

test('S-42 · 방배점 상품 구성과 시행일', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[data-branch="bangbae"]').click();
  await expect(page.locator('#price-meta')).toContainText('가격표 시행일: 2026-10-01');
  const options = await page.locator('#product-select option').evaluateAll((nodes) => nodes.filter((node) => node.value).map((node) => [node.value, node.textContent]));
  expect(options).toEqual(Object.entries(BANGBAE_PRICE_LIST).map(([id, item]) => [id, item.label]));
  for (const id of Object.keys(BANGBAE_PRICE_LIST)) {
    await page.locator('#product-select').selectOption(id);
    for (const frequency of [1, 2, 3]) await expect(page.locator(`[data-frequency="${frequency}"]`)).toBeEnabled();
    await page.locator('[data-frequency="1"]').click();
    // 평일&주말 통합 요금: 일~토 전 요일 선택 가능
    for (const day of [0, 1, 2, 3, 4, 5, 6]) await expect(page.locator(`[data-day="${day}"]`)).toBeEnabled();
  }
});

test('S-43 · 방배점 가격표 금액·등록 할인 전수 대조', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[data-branch="bangbae"]').click();
  for (const [id, item] of Object.entries(BANGBAE_PRICE_LIST)) {
    await page.locator('#product-select').selectOption(id);
    for (const frequency of [1, 2, 3]) {
      await page.locator(`[data-frequency="${frequency}"]`).click();
      for (const [months, percent] of Object.entries(BANGBAE_DISCOUNTS)) {
        await page.locator(`[data-registration="${months}"]`).click();
        const expected = item.fees[frequency] * (100 - percent) / 100;
        expect(Number.isInteger(expected)).toBe(true);
        await expect(page.locator('#applied-fee')).toHaveValue(won(expected));
      }
      await page.locator('[data-registration="1"]').click();
    }
  }
});

test('S-44 · 등록 기간은 방배점에서만 표시되고 기본은 1개월', async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator('#registration-field')).toBeHidden();
  await page.locator('[data-branch="banpo"]').click();
  await expect(page.locator('#registration-field')).toBeHidden();
  await page.locator('[data-branch="bangbae"]').click();
  await expect(page.locator('#registration-field')).toBeVisible();
  await expect(page.locator('[data-registration]')).toHaveText(['1개월 정가', '2개월 5% 할인', '3개월 10% 할인']);
  await expect(page.locator('[data-registration="1"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-registration="3"]').click();
  await page.locator('[data-branch="banpo"]').click();
  await expect(page.locator('#registration-field')).toBeHidden();
  await page.locator('[data-branch="bangbae"]').click();
  await expect(page.locator('[data-registration="1"]')).toHaveAttribute('aria-pressed', 'true');
});

test('S-45 · 방배점 평일+주말 혼합 요일의 정가·할인 계산', async ({ page }) => {
  await gotoApp(page);
  // 2026-10 화(6·13·20·27) + 토(3·10·17·24·31) = 9회, 기준 8회
  await selectBangbae(page);
  await expect(page.locator('#valid-count')).toHaveText('9회');
  await expect(page.locator('#final-fee-display')).toHaveText('360,000원');
  await expect(page.locator('#unit-display')).toHaveText('8회 · 40,000원');
  await expect(page.locator('[data-notice-code="N-REGISTRATION-DISCOUNT"]')).toHaveCount(0);
  await expect(page.locator('#adjust-summary')).toBeHidden();

  await page.locator('[data-registration="2"]').click();
  await expect(page.locator('#final-fee-display')).toHaveText('342,000원');
  await expect(page.locator('#unit-display')).toHaveText('8회 · 38,000원');
  await expect(page.locator('#price-display')).toHaveText('320,000원 · 304,000원');
  await expect(page.locator('#adjust-summary')).toHaveText('가격표 320,000원 → 2개월 등록 5% 할인 304,000원 (-16,000원)');
  await expect(page.locator('[data-notice-code="N-REGISTRATION-DISCOUNT"]')).toContainText('2개월 등록 5% 할인이 적용되었습니다. (가격표 320,000원 → 304,000원)');
  await expect(page.locator('#product-display')).toContainText('2개월 등록 5% 할인');

  await page.locator('[data-registration="3"]').click();
  await expect(page.locator('#final-fee-display')).toHaveText('324,000원');
  await expect(page.locator('#unit-display')).toHaveText('8회 · 36,000원');

  // 개천절(10/3 토)을 반영하면 8회 = 기준 일치 → 할인 적용가 그대로
  await selectHoliday(page, '2026-10-03');
  await expect(page.locator('#valid-count')).toHaveText('8회');
  await expect(page.locator('#final-fee-display')).toHaveText('288,000원');
  // 대여비는 할인 대상이 아니다
  await page.locator('[data-rental-id="locker"]').check();
  await expect(page.locator('#final-fee-display')).toHaveText('298,000원');
});

test('S-46 · 등록 할인이 두 복사 문구에 표시됨', async ({ page }) => {
  await page.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (text) => { window.__copied.push(text); return Promise.resolve(); } } });
  });
  await gotoApp(page);
  await selectBangbae(page, { product: '2v1-regular', frequency: 3, days: [1, 3, 5] });
  await page.locator('#member-name').fill('김테니스');
  // 2026-10 월(5·12·19·26) + 수(7·14·21·28) + 금(2·9·16·23·30) = 13회, 기준 12회
  await expect(page.locator('#valid-count')).toHaveText('13회');
  await expect(page.locator('#final-fee-display')).toHaveText('357,500원');
  await page.locator('#copy-internal').click();
  await page.locator('#copy-member').click();
  let copied = await page.evaluate(() => window.__copied);
  expect(copied[0]).not.toContain('등록 할인');
  expect(copied[1]).not.toContain('등록 할인');

  await page.locator('[data-registration="3"]').click();
  // 330,000 × 0.9 = 297,000 → 회당 24,750 × 13 = 321,750 → 100원 절사 321,700
  await expect(page.locator('#final-fee-display')).toHaveText('321,700원');
  await page.locator('#copy-internal').click();
  await page.locator('#copy-member').click();
  copied = await page.evaluate(() => window.__copied);
  expect(copied[2]).toContain('가격 상품: 정규레슨 2:1 · 평일&주말 · 1인');
  expect(copied[2]).toContain('가격표 시행일: 2026-10-01');
  expect(copied[2]).toContain('가격표 월 기준 요금: 330,000원');
  expect(copied[2]).toContain('등록 할인: 3개월 등록 10% 할인 (할인 적용가 297,000원)');
  expect(copied[2]).toContain('적용 월 기준 요금: 297,000원 (-33,000원)');
  expect(copied[2]).toContain('최종 월 수강료: 321,700원');
  expect(copied[3]).toContain('- 수업: 정규레슨 2:1 · 평일&주말 · 1인 / 주 3회 (월·수·금)');
  expect(copied[3]).toContain('- 등록 할인: 3개월 등록 10% 할인 적용');
  expect(copied[3]).toContain('- 수강료: 321,700원');
});

test('S-47 · 등록 할인과 수동 조정·다음 회원 초기화', async ({ page }) => {
  await gotoApp(page);
  await selectBangbae(page);
  await page.locator('[data-registration="2"]').click();
  await commitAmount(page, '#applied-fee', 300000);
  await expect(page.locator('[data-notice-code="N-PRICE-ADJUSTED"]')).toContainText('할인 적용가 304,000원 → 적용 300,000원 (-4,000원)');
  await expect(page.locator('#reset-applied')).toHaveText('할인 적용가로 되돌리기');
  await page.locator('#reset-applied').click();
  await expect(page.locator('#applied-fee')).toHaveValue('304,000');

  // 등록 기간을 바꾸면 수동 조정은 초기화된다
  await commitAmount(page, '#applied-fee', 300000);
  await page.locator('[data-registration="3"]').click();
  await expect(page.locator('#applied-fee')).toHaveValue('288,000');
  await expect(page.locator('[data-notice-code="N-ADJUST-RESET"]')).toContainText('적용 요금');

  // 최종 결제액 조정도 등록 기간 변경으로 초기화된다
  await commitAmount(page, '#final-fee', 111100);
  await page.locator('[data-registration="1"]').click();
  await expect(page.locator('#final-fee')).toHaveValue('360,000');

  // 다음 회원: 등록 기간은 회원별 값이므로 1개월로 돌아간다
  await page.locator('[data-registration="3"]').click();
  await page.locator('#next-member').click();
  await expect(page.locator('[data-registration="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#applied-fee')).toHaveValue('320,000');
  await expect(page.locator('#final-fee-display')).toHaveText('360,000원');
  await expect(page.locator('[data-branch="bangbae"]')).toHaveAttribute('aria-pressed', 'true');
});

test('S-48 · 375px 모바일에서 방배점 등록 기간 표시', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoApp(page);
  await selectBangbae(page);
  await page.locator('[data-registration="3"]').click();
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    clipped: Array.from(document.querySelectorAll('[data-registration]')).some((node) => node.scrollWidth > node.clientWidth)
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.clipped).toBe(false);
  await expect(page.locator('#final-fee-display')).toHaveText('324,000원');
});

test('S-49 · 반포점 가격은 방배점 개정의 영향을 받지 않음', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[data-branch="banpo"]').click();
  await expect(page.locator('#price-meta')).toContainText('가격표 시행일: 2026-07-06');
  const options = await page.locator('#product-select option').evaluateAll((nodes) => nodes.filter((node) => node.value).map((node) => node.value));
  expect(options).toHaveLength(12);
  const expected = { 'l20-1v1-weekday': [160000, 300000, 420000], 'l30-1v1-weekday': [240000, 440000, 600000], 'l30-1v2-weekday': [180000, 300000, 380000] };
  for (const [id, fees] of Object.entries(expected)) {
    await page.locator('#product-select').selectOption(id);
    for (const frequency of [1, 2, 3]) {
      await page.locator(`[data-frequency="${frequency}"]`).click();
      await expect(page.locator('#applied-fee')).toHaveValue(won(fees[frequency - 1]));
    }
  }
});
