// Genera le immagini della versione leggera dalla scena 3D (richiede `npm run dev` attivo).
// Uso: node scripts/render-frames.mjs [url] [cartella] [solo-indici]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:5173/capture.html';
const out = process.argv[3] || 'public/frames';
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const T = [0, 1.92, 2.92, 3.92, 4.92, 5.92, 6.92, 7.5, 8.92, 9.95, 10.72, 11.75, 12];
const sizes = [['d', 1600, 1000, 'right'], ['m', 780, 1400, 'portrait']];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const onlySize = process.argv[5];
for (const [suf, w, h, layout] of sizes) {
  if (onlySize && suf !== onlySize) continue;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.setDefaultTimeout(600000);
  page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 180000 });
  for (let i = 0; i < T.length; i++) {
    if (only && !only.includes(i)) continue;
    await page.evaluate(([t, w, h, l]) => window.snap(t, w, h, l), [T[i], w, h, layout]);
    const file = `${out}/f${String(i).padStart(2, '0')}-${suf}.webp`;
    const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/webp', 0.8));
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    console.log('ok', file);
  }
  await page.close();
}
await browser.close();
