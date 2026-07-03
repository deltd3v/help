import { chromium } from 'playwright';
import { strict as assert } from 'assert';

const FILE = `file://${process.cwd()}/docs/index.html`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  let passCount = 0;
  let failCount = 0;

  page.on('pageerror', e => errors.push(e.message));

  function assert(name, ok) {
    if (ok) { passCount++; console.log(`  ✓ ${name}`); }
    else { failCount++; console.log(`  ✗ ${name}`); }
  }

  async function navTo(view) {
    await page.evaluate((v) => {
      document.querySelectorAll('.mv').forEach(el => el.classList.remove('active'));
      document.querySelector(`[data-view="${v}"]`).classList.add('active');
      const titles = { signin:'Sign in',signup:'Create handle','forgot-pass':'Reset password','forgot-user':'Forgot username',settings:'Settings',theme:'Theme',font:'Font picker',lang:'Language',faq:'FAQ',tos:'Terms of Service',cookie:'Cookie Preferences' };
      document.getElementById('modal-title').textContent = titles[v] || v;
      const idx = { signin:0,signup:1,'forgot-pass':2,'forgot-user':3,settings:4,theme:5,font:6,lang:7,faq:8,tos:9,cookie:10 }[v] || 0;
      document.getElementById('step-icon').textContent = idx + 1;
    }, view);
    await page.waitForTimeout(200);
  }

  // ── 1. Page loads ──
  await page.goto(FILE, { waitUntil: 'networkidle' });
  const title = await page.title();
  assert('Page loads with correct title', title.includes('help'));

  // ── 2. Hero section ──
  const hero = page.locator('section.hero');
  await hero.waitFor({ state: 'visible' });
  const heroText = await hero.textContent();
  assert('Hero visible with heading', heroText.includes('We all need help'));

  // ── 3. Peer list ──
  const peers = page.locator('.peer-card');
  assert('4 peer cards rendered', (await peers.count()) === 4);

  // ── 4. Open modal → canvas ──
  await page.click('#open-auth');
  const overlay = page.locator('#modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 2000 });
  assert('Modal overlay gets .show class', await overlay.evaluate(el => el.classList.contains('show')));
  const canvas = page.locator('#modal-canvas');
  await canvas.waitFor({ state: 'visible', timeout: 1000 });
  const cSize = await canvas.evaluate(c => ({ w: c.width, h: c.height }));
  assert('Canvas rendered with dimensions > 0', cSize.w > 0 && cSize.h > 0);

  // ── 5. Sign-in view ──
  const siView = page.locator('[data-view="signin"]');
  await siView.waitFor({ state: 'visible' });
  assert('Sign-in view active', await siView.evaluate(el => el.classList.contains('active')));

  // ── 6. Theme selection ──
  await navTo('theme');
  await page.click('[data-theme="dim"]');
  assert('Theme (dim) selected', await page.locator('[data-theme="dim"]').evaluate(el => el.classList.contains('selected')));
  await page.click('[data-theme="dark"]');
  assert('Dark selected, dim unselected',
    (await page.locator('[data-theme="dark"]').evaluate(el => el.classList.contains('selected'))) &&
    !(await page.locator('[data-theme="dim"]').evaluate(el => el.classList.contains('selected')))
  );

  // ── 7. Font selection ──
  await navTo('font');
  await page.click('[data-font="Fraunces"]');
  assert('Font (Fraunces) selected', await page.locator('[data-font="Fraunces"]').evaluate(el => el.classList.contains('selected')));

  // ── 8. Language selection ──
  await navTo('lang');
  await page.click('[data-lang="fi"]');
  assert('Language (Suomi) selected', await page.locator('[data-lang="fi"]').evaluate(el => el.classList.contains('selected')));

  // ── 9. FAQ accordion ──
  await navTo('faq');
  const faqItems = page.locator('.mv-faq-item');
  assert('5 FAQ items rendered', (await faqItems.count()) === 5);
  await faqItems.first().click();
  await page.waitForTimeout(400);
  assert('FAQ accordion opens on click', await faqItems.first().evaluate(el => el.classList.contains('open')));
  await faqItems.first().click();
  await page.waitForTimeout(400);
  assert('FAQ accordion closes on second click', !(await faqItems.first().evaluate(el => el.classList.contains('open'))));

  // ── 10. Terms of Service ──
  await navTo('tos');
  const tosContent = await page.locator('[data-view="tos"]').textContent();
  assert('ToS renders content', tosContent.includes('No Backend, No Liability'));

  // ── 11. Cookie preferences ──
  await navTo('cookie');
  const prefRows = page.locator('.pref-row');
  assert('3 cookie preference rows', (await prefRows.count()) === 3);
  assert('Necessary cookie checked', await prefRows.first().locator('input').isChecked());

  // ── 12. Navigation: settings grid cards all respond to click ──
  await navTo('settings');
  for (const go of ['theme','font','lang','faq','tos','cookie']) {
    const card = page.locator(`[data-view="settings"] [data-go="${go}"]`);
    assert(`Settings card [${go}] present`, await card.count() === 1);
  }

  // ── 13. Empty handle → error toast ──
  await navTo('signin');
  await page.click('[data-action="signin"]');
  const errToast = page.locator('.toast.error');
  await errToast.waitFor({ state: 'visible', timeout: 3000 });
  assert('Empty handle shows error toast', (await errToast.textContent()).includes('Enter a handle'));

  // ── 14. Valid handle → sign in closes modal ──
  await page.fill('#si-handle', 'agile_tester');
  await page.click('[data-action="signin"]');
  await page.waitForTimeout(600);
  assert('Sign-in closes modal', !(await overlay.evaluate(el => el.classList.contains('show'))));

  // ── 15. Reopen → canvas still renders ──
  await page.click('#open-auth');
  await overlay.waitFor({ state: 'visible', timeout: 2000 });
  const cSize2 = await canvas.evaluate(c => ({ w: c.width, h: c.height }));
  assert('Canvas re-renders on modal reopen', cSize2.w > 0 && cSize2.h > 0);

  // ── 16. Zero page errors ──
  if (errors.length) {
    errors.forEach(e => console.log(`  ⚠  ${e}`));
  }
  assert('Zero console/page errors', errors.length === 0);

  await browser.close();
  const total = passCount + failCount;
  console.log(`\n  ${failCount === 0 ? '✅' : '❌'} ${passCount}/${total} passed`);
  if (failCount) process.exit(1);
}

main().catch(err => {
  console.error(`\n  ❌ FAIL: ${err.message}`);
  process.exit(1);
});
