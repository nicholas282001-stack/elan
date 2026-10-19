// Texture procedurali disegnate su canvas: niente file da scaricare.
import * as THREE from 'three';

function rand(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, repeat = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, size, n, r, alpha, light, dark, seed) {
  const R = rand(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = R() > 0.5 ? `rgba(${light},${alpha * R()})` : `rgba(${dark},${alpha * R()})`;
    const s = r * (0.3 + R());
    ctx.fillRect(R() * size, R() * size, s, s);
  }
}

// Calcestruzzo a faccia vista con segni dei casseri.
export function concreteTex(base = '#9c9890', seed = 1) {
  const S = 512; const [c, x] = canvas(S);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  speckle(x, S, 9000, 3, 0.18, '255,255,255', '0,0,0', seed);
  const R = rand(seed + 7);
  for (let i = 0; i < 40; i++) {
    const g = x.createRadialGradient(R() * S, R() * S, 0, R() * S, R() * S, 40 + R() * 120);
    g.addColorStop(0, `rgba(0,0,0,${0.06 * R()})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  x.strokeStyle = 'rgba(0,0,0,.10)'; x.lineWidth = 2;
  for (let y = 0; y <= S; y += S / 4) { x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.18)';
  for (let y = S / 8; y < S; y += S / 4) for (let xx = S / 6; xx < S; xx += S / 3) { x.beginPath(); x.arc(xx, y, 3, 0, 7); x.fill(); }
  return finish(c);
}

// Termolaterizio: blocchi forati 30x19 cm.
export function brickTex() {
  const S = 512; const [c, x] = canvas(S);
  x.fillStyle = '#d9cfc2'; x.fillRect(0, 0, S, S);
  const R = rand(3); const rows = 8, cols = 4, bh = S / rows, bw = S / cols;
  for (let r = 0; r < rows; r++) for (let k = -1; k < cols; k++) {
    const off = (r % 2) * bw / 2; const v = 0.85 + R() * 0.25;
    x.fillStyle = `rgb(${178 * v | 0},${92 * v | 0},${62 * v | 0})`;
    x.fillRect(k * bw + off + 3, r * bh + 3, bw - 6, bh - 6);
  }
  speckle(x, S, 5000, 2, 0.2, '255,220,200', '60,20,10', 4);
  return finish(c);
}

// Intonaco rasato del cappotto.
export function plasterTex(base) {
  const S = 256; const [c, x] = canvas(S);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  speckle(x, S, 4000, 2, 0.08, '255,255,255', '0,0,0', 9);
  return finish(c);
}

// Terreno di cantiere: terra battuta e ghiaia.
export function groundTex() {
  const S = 512; const [c, x] = canvas(S);
  x.fillStyle = '#5b5246'; x.fillRect(0, 0, S, S);
  speckle(x, S, 22000, 3, 0.35, '170,150,120', '10,8,5', 11);
  return finish(c);
}

export function earthTex() {
  const S = 256; const [c, x] = canvas(S);
  x.fillStyle = '#5a4532'; x.fillRect(0, 0, S, S);
  const R = rand(5);
  for (let y = 0; y < S; y += 4) { x.fillStyle = `rgba(0,0,0,${R() * 0.15})`; x.fillRect(0, y, S, 2 + R() * 3); }
  speckle(x, S, 6000, 3, 0.3, '200,170,130', '20,10,5', 6);
  return finish(c);
}

// Parquet per le finiture interne.
export function woodTex() {
  const S = 512; const [c, x] = canvas(S);
  const R = rand(21); const pw = S / 6;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const v = 0.85 + R() * 0.3; const off = (i % 2) * S / 6;
    x.fillStyle = `rgb(${168 * v | 0},${122 * v | 0},${82 * v | 0})`;
    x.fillRect(i * pw, j * S / 3 + off - S / 6, pw - 2, S / 3 - 2);
    x.fillRect(i * pw, j * S / 3 + off + S - S / 6, pw - 2, S / 3 - 2);
  }
  for (let i = 0; i < 400; i++) { x.strokeStyle = `rgba(60,30,10,${R() * 0.12})`; x.beginPath(); const xx = R() * S; x.moveTo(xx, 0); x.lineTo(xx + R() * 4, S); x.stroke(); }
  return finish(c);
}

// Traliccio della gru: trasparente dove non c'e' acciaio.
export function latticeTex() {
  const S = 128; const [c, x] = canvas(S);
  x.clearRect(0, 0, S, S); x.strokeStyle = '#fff'; x.lineWidth = 10;
  x.strokeRect(0, 0, S, S); x.lineWidth = 6;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(S, S); x.moveTo(S, 0); x.lineTo(0, S); x.stroke();
  const t = finish(c, 1, false); return t;
}

// Pannello fotovoltaico.
export function pvTex() {
  const S = 256; const [c, x] = canvas(S);
  x.fillStyle = '#0d1626'; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(140,170,220,.35)'; x.lineWidth = 2;
  for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * S / 6, 0); x.lineTo(i * S / 6, S); x.stroke(); }
  for (let i = 0; i <= 10; i++) { x.beginPath(); x.moveTo(0, i * S / 10); x.lineTo(S, i * S / 10); x.stroke(); }
  x.strokeStyle = '#c9ccd0'; x.lineWidth = 6; x.strokeRect(0, 0, S, S);
  return finish(c);
}

// Puntino morbido per polvere e particelle.
export function dotTex() {
  const S = 64; const [c, x] = canvas(S);
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return finish(c, 1, false);
}

// Etichetta di quota (testo su canvas).
export function labelTex(text, color = '#DF9526') {
  const [c, x] = canvas(512); c.height = 128;
  x.font = '500 64px "IBM Plex Mono", monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(18,19,17,.72)';
  const w = x.measureText(text).width + 48;
  x.fillRect((512 - w) / 2, 14, w, 100);
  x.fillStyle = color; x.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Facciata generica degli edifici vicini: intonaco chiaro e finestre.
// Con emissive=true restituisce la mappa delle finestre accese la sera.
export function neighbourTex(emissive) {
  const S = 256; const [c, x] = canvas(S); const R = rand(emissive ? 77 : 76);
  x.fillStyle = emissive ? '#000' : '#bdb5a6'; x.fillRect(0, 0, S, S);
  if (!emissive) speckle(x, S, 3000, 2, 0.15, '255,255,255', '0,0,0', 12);
  const R2 = rand(99);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
    const lit = R2() > 0.55;
    if (emissive) { if (lit) { x.fillStyle = `rgba(255,${190 + R() * 40 | 0},120,1)`; x.fillRect(k * 64 + 20, r * 64 + 18, 24, 32); } }
    else { x.fillStyle = '#2b2a27'; x.fillRect(k * 64 + 20, r * 64 + 18, 24, 32); x.fillStyle = '#e6e1d6'; x.fillRect(k * 64 + 14, r * 64 + 52, 36, 3); }
  }
  return finish(c);
}
