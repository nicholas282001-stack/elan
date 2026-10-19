import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles/main.css';
import Lenis from 'lenis';
import { FASI, ELEMENTI, ALIAS, ORDINE_ELEMENTI } from './data/content.js';

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const params = new URLSearchParams(location.search);
const mq = (q) => window.matchMedia(q).matches;
const reduced = mq('(prefers-reduced-motion: reduce)');
const mobile = mq('(max-width: 760px)') || mq('(pointer: coarse)');

// ---------------- scelta della versione: 3D o leggera ----------------
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
const conn = navigator.connection || {};
const lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 3) || (mobile && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || conn.saveData;
let mode = '3d';
if (!hasWebGL()) mode = 'lite';
else if (params.has('lite') || reduced || lowPower) mode = 'lite';
if (params.has('3d') && hasWebGL()) mode = '3d';
document.documentElement.dataset.mode = mode;

const quality = {
  high: !mobile && (navigator.hardwareConcurrency || 4) >= 6,
  bloom: !mobile && (navigator.hardwareConcurrency || 4) >= 6,
  shadow: mobile ? 1024 : 2048,
  maxDpr: mobile ? 1.5 : 1.75,
  reduced,
};

// ---------------- intestazione e menu ----------------
const header = $('.site-header');
const menuBtn = $('.menu-btn'), mobileNav = $('#mobile-nav');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open)); mobileNav.hidden = !open;
  menuBtn.querySelector('.sr').textContent = open ? 'Chiudi il menu' : 'Apri il menu';
});
mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) { menuBtn.setAttribute('aria-expanded', 'false'); mobileNav.hidden = true; } });

// ---------------- scorrimento morbido ----------------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = document.querySelector(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: a.getAttribute('href').startsWith('#fase') ? 0 : -10, duration: 1.6 });
  });
}

// ---------------- elementi dell'esperienza ----------------
const stage = $('#stage'), canvas = $('#scene'), hud = $('#hud');
const hero = $('#hero'), heroInner = $('.hero-inner'), rewind = $('#rewind'), rewindN = $('#rewind-n');
const chaptersEl = $('#chapters');
const chapters = [...document.querySelectorAll('.chapter')];
const hudOra = $('#hud-ora'), hudMomento = $('#hud-momento');

// Su telefono le schede partono chiuse per lasciare spazio alla scena.
if (mobile) document.querySelectorAll('.ch-details').forEach((d) => d.removeAttribute('open'));

// indice delle fasi a destra
const phasesOl = $('#hud-phases');
FASI.forEach((f, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" data-i="${i}" aria-label="Fase ${f.n}: ${f.titolo}"><span>${f.n} · ${f.titolo}</span><i></i></button>`;
  phasesOl.appendChild(li);
});
const phaseBtns = [...phasesOl.querySelectorAll('button')];
phasesOl.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const ch = chapters[+b.dataset.i];
  if (lenis) lenis.scrollTo(ch, { duration: 1.8 }); else ch.scrollIntoView();
  setTimeout(() => ch.querySelector('h2').focus?.(), 50);
});
chapters.forEach((c) => c.querySelector('h2').setAttribute('tabindex', '-1'));

// orario mostrato in alto
const LABELS = [[0, '06:10', 'alba'], [1.5, '07:30', 'mattino'], [4, '10:00', 'mattino'], [6, '13:00', 'mezzogiorno'], [8, '16:30', 'pomeriggio'], [9.5, '18:40', 'tramonto'], [10.8, '20:15', 'sera'], [11.6, '21:30', 'sera']];
const timeAt = (t) => { let l = LABELS[0]; for (const x of LABELS) if (t >= x[0]) l = x; return l; };

// ---------------- calcolo della posizione nel racconto ----------------
let metrics = {};
function measure() {
  const vh = window.innerHeight;
  const top = (el) => el.getBoundingClientRect().top + window.scrollY;
  metrics = { vh, heroTop: top(hero), heroH: hero.offsetHeight, chTop: top(chaptersEl), chH: chapters[0].offsetHeight, expEnd: top(chaptersEl) + chaptersEl.offsetHeight };
}
function storyT(y) {
  const { vh, heroTop, heroH, chTop, chH } = metrics;
  const mid = y + vh * 0.5;
  if (mid >= chTop) return { t: clamp((mid - chTop) / chH, 0, 12), rew: 1 };
  const p = clamp((y - heroTop) / (heroH - vh * 0.65), 0, 1);
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  return { t: 12 * (1 - e), rew: p };
}

let exp = null; // API della scena 3D
let current = -1;
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('solid', y > 40);
  const { t, rew } = storyT(y);
  // testo di apertura e indicatore di riavvolgimento
  heroInner.style.opacity = String(clamp(1 - rew * 3.2, 0, 1));
  heroInner.style.visibility = rew > 0.33 ? 'hidden' : 'visible';
  const rw = rew > 0.05 && rew < 1 ? Math.sin(clamp((rew - 0.05) / 0.9, 0, 1) * Math.PI) : 0;
  rewind.style.opacity = String(rw);
  rewindN.textContent = String(Math.max(0, Math.floor(t - 0.01))).padStart(2, '0');
  hud.classList.toggle('on', rew >= 1 && y < metrics.expEnd - metrics.vh * 0.6);
  const i = rew >= 1 ? clamp(Math.floor(t), 0, 11) : -1;
  if (i !== current) {
    current = i;
    phaseBtns.forEach((b, k) => { b.toggleAttribute('aria-current', k === i); if (k === i) b.setAttribute('aria-current', 'step'); b.classList.toggle('done', k < i); });
  }
  const [, ora, mom] = timeAt(t); hudOra.textContent = ora; hudMomento.textContent = mom;
  if (exp) exp.setTarget(t); else if (mode === 'lite') liteFrame(t);
  // pausa del rendering quando la scena non e' visibile
  if (exp) exp.setActive(y < metrics.expEnd);
}

// ---------------- versione leggera: immagini dalla stessa scena ----------------
const framesEl = $('#frames');
let frames = [];
function setupLite() {
  const suf = mobile ? 'm' : 'd';
  for (let k = 0; k <= 12; k++) {
    const img = new Image(); img.alt = ''; img.decoding = 'async';
    img.loading = k === 12 || k === 0 ? 'eager' : 'lazy';
    img.src = `frames/f${String(k).padStart(2, '0')}-${suf}.webp`;
    framesEl.appendChild(img); frames.push(img);
  }
  $('#t-explore').hidden = true; $('#t-section').hidden = true; $('#t-site').hidden = true;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tool'; btn.id = 't-3d';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg><span>Attiva il 3D</span>';
  if (hasWebGL()) { $('.toolbar').prepend(btn); btn.addEventListener('click', () => { location.search = '?3d'; }); }
}
let liteIdx = -1;
function liteFrame(t) {
  const k = clamp(Math.round(t - 0.4), 0, 12);
  if (k === liteIdx) return; liteIdx = k;
  frames.forEach((f, j) => f.classList.toggle('on', j === k));
  $('#poster').style.opacity = '0';
}

// ---------------- caricamento della scena 3D ----------------
const loader = $('#loader'), loaderPct = $('#loader-pct'), loaderBar = $('#loader-bar');
let loading = false;
function progress(p) { const v = Math.round(p * 100); loaderPct.textContent = v + '%'; loaderBar.style.width = v + '%'; }
async function load3D() {
  if (loading || mode !== '3d') return; loading = true;
  loader.hidden = false; progress(0.02);
  try {
    const { createExperience } = await import('./three/scene.js');
    progress(0.08);
    exp = await createExperience({ canvas, quality, onProgress: (p) => progress(0.08 + p * 0.92) });
    window.__elan = exp;
    exp.setLayout(mobile ? 'portrait' : 'right');
    const { t } = storyT(window.scrollY); exp.jump(t);
    stage.classList.add('ready');
    loader.hidden = true;
    onScroll();
  } catch (err) {
    console.warn('3D non disponibile, passo alla versione leggera', err);
    mode = 'lite'; document.documentElement.dataset.mode = 'lite'; loader.hidden = true; setupLite(); onScroll();
  }
}
// Il 3D si carica dopo la pagina: al primo gesto dell'utente o quando il browser e' libero.
function scheduleLoad() {
  const go = () => { load3D(); off(); };
  const evs = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'];
  const off = () => evs.forEach((e) => window.removeEventListener(e, go));
  evs.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
  if (!mobile) {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    window.addEventListener('load', () => idle(go, { timeout: 2500 }));
  }
}

// ---------------- strumenti ----------------
const toolExplore = $('#t-explore'), toolSection = $('#t-section'), toolSite = $('#t-site'), toolParts = $('#t-parts');
const partsMenu = $('#parts-menu'), exploreLayer = $('#explore-layer');
ORDINE_ELEMENTI.forEach((k) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.part = k; b.textContent = ELEMENTI[k].nome; partsMenu.appendChild(b); });

const press = (btn, v) => btn.setAttribute('aria-pressed', String(v));
toolSection.addEventListener('click', () => { const v = toolSection.getAttribute('aria-pressed') !== 'true'; press(toolSection, v); exp?.setSection(v); });
toolSite.addEventListener('click', () => { const v = toolSite.getAttribute('aria-pressed') !== 'true'; press(toolSite, v); exp?.setCantiere(v); });
toolParts.addEventListener('click', () => { const v = partsMenu.hidden; partsMenu.hidden = !v; toolParts.setAttribute('aria-expanded', String(v)); if (v) partsMenu.querySelector('button').focus(); });
partsMenu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; partsMenu.hidden = true; toolParts.setAttribute('aria-expanded', 'false'); openPart(b.dataset.part, toolParts); });

function setExplore(v) {
  press(toolExplore, v); exploreLayer.hidden = !v; exp?.setExplore(v);
  if (v) { lenis?.stop(); document.body.style.overflow = 'hidden'; $('#explore-exit').focus(); }
  else { lenis?.start(); document.body.style.overflow = ''; exp?.resetView(); toolExplore.focus(); }
}
toolExplore.addEventListener('click', () => setExplore(toolExplore.getAttribute('aria-pressed') !== 'true'));
$('#explore-exit').addEventListener('click', () => setExplore(false));

// trascinamento e zoom in modalita' esplorazione
{
  const pts = new Map(); let lastD = 0, moved = 0;
  exploreLayer.addEventListener('pointerdown', (e) => { exploreLayer.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; });
  exploreLayer.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const [x0, y0] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { exp?.rotate(-(e.clientX - x0) * 0.25, (e.clientY - y0) * 0.15); moved += Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (lastD) exp?.zoomBy(lastD / d); lastD = d; moved = 99; }
  });
  const up = (e) => {
    if (pts.size === 1 && moved < 6 && exp) { const p = exp.pick(e.clientX, e.clientY); if (p) openPart(p); }
    pts.delete(e.pointerId); lastD = 0;
  };
  exploreLayer.addEventListener('pointerup', up); exploreLayer.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); lastD = 0; });
  exploreLayer.addEventListener('wheel', (e) => { e.preventDefault(); exp?.zoomBy(e.deltaY > 0 ? 1.08 : 0.93); }, { passive: false });
}
// tocco su un elemento anche durante il racconto
canvas.addEventListener('click', (e) => { if (!exp) return; const p = exp.pick(e.clientX, e.clientY); if (p) openPart(p); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!partPanel.hidden) closePart(); else if (!partsMenu.hidden) { partsMenu.hidden = true; toolParts.setAttribute('aria-expanded', 'false'); toolParts.focus(); } else if (!exploreLayer.hidden) setExplore(false);
  }
  if (!exploreLayer.hidden && exp) {
    const k = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
    if (k) { e.preventDefault(); exp.rotate(...k); }
    if (e.key === '+' || e.key === '=') exp.zoomBy(0.9);
    if (e.key === '-') exp.zoomBy(1.1);
  }
});

// ---------------- scheda stratigrafia ----------------
const partPanel = $('#part-panel');
let lastFocus = null;
const COLORS = [[/cappotto|isolant|lana/i, '#e3d39b'], [/termolaterizio|laterizio/i, '#b0603f'], [/acciaio|barre|staffe/i, '#8b4f2c'], [/intonaco|finitura|rasatura|protezione/i, '#e9e6df'], [/pavimento|gres/i, '#c7b7a0'], [/impermeab/i, '#2c2c2a'], [/terreno/i, '#5a4532'], [/calcestruzzo|platea|solaio|soletta|massetto|magrone|nucleo|sottofondo|copriferro/i, '#8d8a83']];
function openPart(part, from) {
  const key = ALIAS[part] || part; const el = ELEMENTI[key]; if (!el) return;
  lastFocus = from || document.activeElement;
  $('#part-title').textContent = el.nome; $('#part-desc').textContent = el.desc;
  $('#part-strata').innerHTML = el.strati.map(([nome, th, src]) => {
    const c = (COLORS.find(([re]) => re.test(nome)) || [0, '#DF9526'])[1];
    const h = th ? clamp(th * 1.4, 8, 56) : 8;
    return `<div class="stratum"><span class="bar" style="--h:${h}px;--c:${c}"></span><span>${nome}<span class="tag ${src}">${src === 'cap' ? 'Capitolato' : 'Indicativo'}</span></span><span class="th">${th ? String(th).replace('.', ',') + ' cm' : '—'}</span></div>`;
  }).join('') + (el.note ? `<p class="note">${el.note}</p>` : '');
  partPanel.hidden = false; partPanel.focus();
  exp?.highlight([key, ...Object.keys(ALIAS).filter((k) => ALIAS[k] === key)]);
}
function closePart() { partPanel.hidden = true; exp?.highlight(null); lastFocus?.focus?.(); }
$('#part-close').addEventListener('click', closePart);

// ---------------- prima / dopo ----------------
{
  const range = $('#ba-range'), frame = $('.ba-frame');
  const set = () => frame.style.setProperty('--x', range.value + '%');
  range.addEventListener('input', set); set();
}

// ---------------- comparsa delle sezioni ----------------
if (!reduced && 'IntersectionObserver' in window) {
  const els = document.querySelectorAll('.section-head, .project, .benefit, .steps li, .ba, .portrait, .timeline, .cta-inner > *');
  els.forEach((e, i) => { e.classList.add('reveal'); e.style.transitionDelay = `${(i % 4) * 70}ms`; });
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach((e) => io.observe(e));
}

// ---------------- avvio ----------------
measure();
window.addEventListener('resize', () => { measure(); exp?.resize(); onScroll(); });
window.addEventListener('load', () => { measure(); onScroll(); });
if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
if (mode === 'lite') setupLite(); else scheduleLoad();
onScroll();
