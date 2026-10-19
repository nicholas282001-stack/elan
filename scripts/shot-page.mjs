// Screenshot della pagina a diverse posizioni di scorrimento.
// Uso: node scripts/shot-page.mjs <url> <cartella> <larghezza> <altezza> <y1,y2,...|full>
import { chromium } from 'playwright';
const [url, out, w, h, ys] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
if (ys === 'full') { await page.screenshot({ path: `${out}/full.png`, fullPage: true }); }
else for (const y of ys.split(',')) {
  const target = y.startsWith('#') ? await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, y) : +y;
  await page.evaluate((v) => window.scrollTo(0, v), target);
  await page.waitForTimeout(+process.env.WAIT || 1200);
  await page.screenshot({ path: `${out}/s-${y.replace('#', '')}.png` });
}
console.log(errs.slice(0, 15).join('\n'));
await browser.close();
