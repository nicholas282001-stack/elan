// Modello procedurale: vecchia palazzina, cantiere ed edificio nuovo.
// Unita': 1 = 1 metro. Il fronte principale guarda verso +Z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';

export const DIM = { W: 22, D: 13, H: 3.1, N: 5, B: -3.0, PIT: 3.6 };
const { W, D, H, N } = DIM;
export const ROOF = N * H;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- geometria ----------
function boxUV(g, scale) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv.setXY(i, u / scale, v / scale);
  }
  return g;
}
function box(w, h, d, x, y, z, uvs = 3) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return boxUV(g, uvs);
}
const merge = (list) => mergeGeometries(list.filter(Boolean));

// Parete lungo X locale (da -len/2 a len/2), base y=0, spessore t centrato in z=0.
function wallGeoms(len, h, t, openings, uvs = 3) {
  const out = []; const ops = [...openings].sort((a, b) => a.c - b.c);
  let x0 = -len / 2;
  for (const o of ops) {
    const a = o.c - o.w / 2, b = o.c + o.w / 2;
    if (a > x0) out.push(box(a - x0, h, t, (x0 + a) / 2, h / 2, 0, uvs));
    if (o.sill > 0) out.push(box(o.w, o.sill, t, o.c, o.sill / 2, 0, uvs));
    const top = o.sill + o.h;
    if (top < h) out.push(box(o.w, h - top, t, o.c, (top + h) / 2, 0, uvs));
    x0 = b;
  }
  if (x0 < len / 2) out.push(box(len / 2 - x0, h, t, (x0 + len / 2) / 2, h / 2, 0, uvs));
  return out;
}
// Posiziona geometrie di una parete locale su un lato dell'edificio.
function place(geoms, side, off) {
  const m = new THREE.Matrix4();
  if (side === 'front') m.makeTranslation(0, 0, D / 2 + off);
  if (side === 'back') m.makeRotationY(Math.PI).setPosition(0, 0, -D / 2 - off);
  if (side === 'left') m.makeRotationY(-Math.PI / 2).setPosition(-W / 2 - off, 0, 0);
  if (side === 'right') m.makeRotationY(Math.PI / 2).setPosition(W / 2 + off, 0, 0);
  return geoms.map((g) => g.applyMatrix4(m));
}

// Aperture per lato (centri relativi alla lunghezza del lato).
const BAYX = [-8.14, -2.71, 2.71, 8.14];
const BAYZ = [-3.1, 3.1];
function openingsFor(side, k) {
  if (side === 'front') return BAYX.map((c) => ({ c, w: k === 0 ? 3.0 : 2.4, sill: 0, h: 2.45 }));
  if (side === 'back') return BAYX.filter((c) => Math.abs(c) > 3).map((c) => ({ c, w: 1.4, sill: 0.9, h: 1.45 }));
  return BAYZ.map((c) => ({ c, w: 1.4, sill: 0.9, h: 1.45 }));
}
const SIDES = ['front', 'back', 'left', 'right'];
const sideLen = (s) => (s === 'front' || s === 'back' ? W : D);

// Ogni gruppo animato ha origine alla base: si "costruisce" scalando in Y.
function grower(geo, mat, part, y = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y; m.userData.part = part; m.castShadow = true; m.receiveShadow = true;
  return m;
}
function show(o, p, mode = 'y') {
  o.visible = p > 0.001;
  const e = easeOut(p);
  if (mode === 'y') o.scale.set(1, Math.max(e, 0.0001), 1);
  else if (mode === 'x') o.scale.set(Math.max(e, 0.0001), 1, 1);
  else if (mode === 'all') o.scale.setScalar(Math.max(e, 0.0001));
}

// ---------- materiali ----------
export function makeMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const concreteLight = TX.concreteTex('#a8a49b', 2);
  const concreteDark = TX.concreteTex('#7d7a73', 3);
  return {
    fondazione: std({ map: concreteDark, roughness: 0.92 }),
    pilastro: std({ map: concreteLight, roughness: 0.85 }),
    solaio: std({ map: TX.concreteTex('#9a968d', 4), roughness: 0.88 }),
    parete: std({ map: TX.brickTex(), roughness: 0.9, transparent: true }),
    tramezzo: std({ color: '#cfc8bd', roughness: 0.9, transparent: true }),
    facciata: std({ map: TX.plasterTex('#45464a'), roughness: 0.75 }),
    fasce: std({ map: TX.plasterTex('#e9e6df'), roughness: 0.6 }),
    balcone: std({ map: TX.plasterTex('#efece6'), roughness: 0.6 }),
    vetro: std({ color: '#1a2128', metalness: 0.9, roughness: 0.06, envMapIntensity: 1.4 }),
    telaio: std({ color: '#6b5332', metalness: 0.75, roughness: 0.35 }),
    parapetto: new THREE.MeshPhysicalMaterial({ color: '#cfe3e6', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.28, envMapIntensity: 1.2 }),
    copertura: std({ map: TX.concreteTex('#8e8b85', 8), roughness: 0.9 }),
    fotovoltaico: std({ map: TX.pvTex(), metalness: 0.6, roughness: 0.25 }),
    impianti: std({ color: '#b87333', metalness: 0.8, roughness: 0.3 }),
    impiantiBlu: std({ color: '#3d6fb0', metalness: 0.3, roughness: 0.45 }),
    impiantiRosso: std({ color: '#b5473c', metalness: 0.3, roughness: 0.45 }),
    impiantiOro: std({ color: '#DF9526', emissive: '#DF9526', emissiveIntensity: 0.4, roughness: 0.4 }),
    pavimento: std({ map: TX.woodTex(), roughness: 0.55 }),
    arredo: std({ color: '#d8d2c8', roughness: 0.8 }),
    arredoScuro: std({ color: '#2f302c', roughness: 0.6 }),
    luce: std({ color: '#ffe2b0', emissive: '#ffcf86', emissiveIntensity: 0 }),
    glow: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    // contesto e cantiere
    terreno: std({ map: TX.groundTex(), color: '#c9c0b0', roughness: 1 }),
    terra: std({ map: TX.earthTex(), roughness: 1 }),
    magrone: std({ color: '#8f8b84', roughness: 1 }),
    ferro: new THREE.LineBasicMaterial({ color: '#b5683a', transparent: true }),
    oro: new THREE.LineBasicMaterial({ color: '#DF9526', transparent: true }),
    gru: std({ color: '#D9A036', metalness: 0.4, roughness: 0.5, alphaMap: TX.latticeTex(), alphaTest: 0.5, side: THREE.DoubleSide }),
    gruPieno: std({ color: '#D9A036', metalness: 0.4, roughness: 0.5 }),
    acciaio: std({ color: '#9aa0a6', metalness: 0.7, roughness: 0.4 }),
    tavole: std({ color: '#7d6a52', roughness: 0.9 }),
    recinzione: std({ color: '#1c1d1a', roughness: 0.7 }),
    vecchio: std({ roughness: 0.95 }),
    tegole: std({ roughness: 0.9 }),
    pietra: std({ map: TX.plasterTex('#cfc6b6'), roughness: 0.85 }),
    foglie: std({ color: '#4c5a3a', roughness: 0.9, flatShading: true }),
    tronco: std({ color: '#4a3a2c', roughness: 1 }),
    vicini: std({ map: TX.neighbourTex(false), emissiveMap: TX.neighbourTex(true), emissive: '#ffc27a', emissiveIntensity: 0, roughness: 0.95 }),
    mare: std({ color: '#203345', metalness: 0.35, roughness: 0.18, envMapIntensity: 1.6 }),
    sabbia: std({ color: '#8c7a62', roughness: 1 }),
    colline: std({ color: '#2a2e26', roughness: 1, flatShading: true }),
    polvere: new THREE.PointsMaterial({ color: '#c9b9a0', size: 2.4, map: TX.dotTex(), transparent: true, depthWrite: false, opacity: 0 }),
  };
}

// Facciata della vecchia palazzina con finestre e persiane disegnate.
function oldFacadeTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#c9a77a'; x.fillRect(0, 0, 256, 256);
  const R = rnd(31);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${R() > .5 ? '255,240,210' : '70,50,30'},${R() * 0.2})`; x.fillRect(R() * 256, R() * 256, 3, 3); }
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(60,45,30,.12)'; x.fillRect(R() * 256, 0, 6 + R() * 20, 256); }
  x.fillStyle = '#e8dcc4'; x.fillRect(84, 64, 88, 136);
  x.fillStyle = '#26221d'; x.fillRect(94, 74, 68, 120);
  x.fillStyle = '#4f6a50'; x.fillRect(58, 70, 34, 124); x.fillRect(164, 70, 34, 124);
  x.strokeStyle = 'rgba(0,0,0,.35)'; for (let y = 74; y < 194; y += 8) { x.beginPath(); x.moveTo(58, y); x.lineTo(92, y); x.moveTo(164, y); x.lineTo(198, y); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tileTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#9b4a2c'; x.fillRect(0, 0, 256, 256); const R = rnd(8);
  for (let y = 0; y < 256; y += 16) for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(${R() > .5 ? '230,140,90' : '40,10,0'},${R() * 0.35})`; x.fillRect(i * 16 + (y / 16 % 2) * 8, y, 14, 14); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
}

// ======================================================================
export function buildWorld(M, quality) {
  const root = new THREE.Group();
  const building = new THREE.Group(); root.add(building); // materiali con taglio sezione
  const site = new THREE.Group(); root.add(site);
  const anim = []; // funzioni update(t, ctx)
  const R = rnd(42);

  // ---------------- Terreno con scavo ----------------
  const PX = 12.6, PZ = 8.2, PD = DIM.PIT;
  {
    const shape = new THREE.Shape();
    shape.moveTo(-450, -105); shape.lineTo(450, -105); shape.lineTo(450, 400); shape.lineTo(-450, 400); shape.lineTo(-450, -105);
    const hole = new THREE.Path(); hole.moveTo(-PX, -PZ); hole.lineTo(-PX, PZ); hole.lineTo(PX, PZ); hole.lineTo(PX, -PZ); hole.lineTo(-PX, -PZ);
    shape.holes.push(hole);
    const g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 6);
    const ground = new THREE.Mesh(g, M.terreno); ground.receiveShadow = true; site.add(ground);

    // Il "coperchio" dello scavo scende con la terra; le pareti dello scavo crescono.
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(PX * 2, PZ * 2).rotateX(-Math.PI / 2), M.terreno);
    lid.receiveShadow = true; site.add(lid);
    const pitWalls = new THREE.Group(); site.add(pitWalls);
    const pw = [[PX * 2, 0, PZ, Math.PI], [PX * 2, 0, -PZ, 0], [PZ * 2, PX, 0, -Math.PI / 2], [PZ * 2, -PX, 0, Math.PI / 2]];
    for (const [len, x, z, ry] of pw) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, PD).translate(0, -PD / 2, 0), M.terra);
      m.position.set(x, 0, z); m.rotation.y = ry; m.receiveShadow = true; pitWalls.add(m);
    }
    // cumuli di terra durante lo scavo
    const piles = new THREE.Group(); site.add(piles);
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(new THREE.ConeGeometry(4 + i, 2.6 + i * 0.4, 9).translate(0, 1.3 + i * .2, 0), M.terra);
      p.position.set(19 + i * 3.5, 0, -6 + i * 5); p.castShadow = true; piles.add(p);
    }
    anim.push((t) => {
      const dig = ease(win(t, 2.05, 2.9)) - ease(win(t, 11.0, 11.35));
      lid.position.y = -PD * dig - 0.012;
      lid.material = dig > 0.98 && t < 3.05 ? M.terra : M.terreno;
      pitWalls.visible = dig > 0.002; pitWalls.scale.y = Math.max(dig, 0.001);
      const pile = win(t, 2.2, 2.9) * (1 - win(t, 10.6, 11.1));
      piles.visible = pile > 0.01; piles.scale.set(1, pile, 1);
    });
  }

  // ---------------- Vecchia palazzina ----------------
  {
    const old = new THREE.Group(); site.add(old);
    const ow = 18, od = 11, oh = 3.0, of = 3; const ft = oldFacadeTex();
    const om = M.vecchio; om.map = ft;
    const chunks = [];
    const add = (mesh, delay) => { mesh.castShadow = mesh.receiveShadow = true; old.add(mesh); chunks.push({ mesh, delay, p0: mesh.position.clone(), r0: mesh.rotation.clone(), v: new THREE.Vector3((R() - .5) * 6, R() * 2, (R() - .5) * 6), w: new THREE.Vector3((R() - .5) * 3, (R() - .5) * 3, (R() - .5) * 3) }); };
    for (let k = 0; k < of; k++) {
      for (const [len, x, z, ry] of [[ow, 0, od / 2, 0], [ow, 0, -od / 2, Math.PI], [od, -ow / 2, 0, -Math.PI / 2], [od, ow / 2, 0, Math.PI / 2]]) {
        const n = Math.round(len / 3);
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(len / n, oh, 0.35), om);
          const lx = -len / 2 + (i + 0.5) * len / n;
          m.position.set(x + Math.cos(ry) * lx, k * oh + oh / 2, z - Math.sin(ry) * lx); m.rotation.y = ry;
          add(m, (of - 1 - k) * 0.22 + R() * 0.12 + 0.18);
        }
      }
      const slab = new THREE.Mesh(new THREE.BoxGeometry(ow, 0.25, od), M.fondazione);
      slab.position.y = (k + 1) * oh; add(slab, (of - 1 - k) * 0.22 + 0.25);
    }
    // tetto a padiglione in 4 falde
    const tm = M.tegole; tm.map = tileTex();
    const rh = 2.6, eave = 0.6, L = ow / 2 + eave, Dd = od / 2 + eave, ridge = L - Dd;
    const falde = [
      [[-L, 0, Dd], [L, 0, Dd], [ridge, rh, 0], [-ridge, rh, 0]],
      [[L, 0, -Dd], [-L, 0, -Dd], [-ridge, rh, 0], [ridge, rh, 0]],
      [[-L, 0, -Dd], [-L, 0, Dd], [-ridge, rh, 0]],
      [[L, 0, Dd], [L, 0, -Dd], [ridge, rh, 0]],
    ];
    for (const f of falde) {
      const pts = f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(pts.flatMap((p) => [p[0] / 3, p[2] / 3 + p[1] / 3]), 2));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, tm); tm.side = THREE.DoubleSide; m.position.y = of * oh + 0.12; add(m, R() * 0.1);
    }
    // polvere
    const NP = quality.high ? 700 : 300; const pos = new Float32Array(NP * 3); const seeds = [];
    for (let i = 0; i < NP; i++) seeds.push([(R() - .5) * 26, R() * 10, (R() - .5) * 18, 0.4 + R()]);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dg, M.polvere); dust.frustumCulled = false; site.add(dust);

    anim.push((t) => {
      const T = win(t, 0.05, 0.98);
      old.visible = T < 1;
      for (const c of chunks) {
        const p = clamp01((T * 1.25 - c.delay) / 0.45);
        const m = c.mesh; m.visible = p < 1;
        if (!m.visible) continue;
        const q = p * p;
        m.position.set(c.p0.x + c.v.x * p, c.p0.y + c.v.y * p - q * (c.p0.y + 3), c.p0.z + c.v.z * p);
        m.rotation.set(c.r0.x + c.w.x * q, c.r0.y + c.w.y * q, c.r0.z + c.w.z * q);
        m.scale.setScalar(1 - Math.max(0, p - 0.6) / 0.4 * 0.9);
      }
      const dp = win(t, 0.12, 1.25);
      dust.visible = dp > 0 && dp < 1;
      M.polvere.opacity = Math.sin(dp * Math.PI) * 0.55;
      for (let i = 0; i < NP; i++) {
        const s = seeds[i];
        pos[i * 3] = s[0] * (0.6 + dp * 0.8); pos[i * 3 + 1] = s[1] * dp * 1.6 * s[3]; pos[i * 3 + 2] = s[2] * (0.6 + dp * 0.8);
      }
      dg.attributes.position.needsUpdate = true;
    });
  }

  // ---------------- Rilievo: tracciamento in oro ----------------
  {
    const g = new THREE.Group(); site.add(g);
    const pts = [[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2], [-W / 2, D / 2]].map(([x, z]) => new THREE.Vector3(x, 0.06, z));
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    const outline = new THREE.Line(lg, M.oro); g.add(outline);
    // allineamenti dei pilastri (fili fissi)
    const axes = [];
    for (const x of [-10.85, -5.425, 0, 5.425, 10.85]) axes.push(new THREE.Vector3(x, 0.05, -D / 2 - 3), new THREE.Vector3(x, 0.05, D / 2 + 3));
    for (const z of [-6.25, 0, 6.25]) axes.push(new THREE.Vector3(-W / 2 - 3, 0.05, z), new THREE.Vector3(W / 2 + 3, 0.05, z));
    const axMat = M.oro.clone(); axMat.opacity = 0.45;
    const ax = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axes), axMat); g.add(ax);
    // picchetti
    const stakes = new THREE.Group(); g.add(stakes);
    const sg = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6).translate(0, 0.4, 0);
    const tipM = new THREE.MeshBasicMaterial({ color: '#DF9526' });
    for (const [x, z] of [[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]]) {
      const s = new THREE.Mesh(sg, M.tavole); s.position.set(x, 0, z); stakes.add(s);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), tipM); tip.position.set(x, 0.85, z); stakes.add(tip);
    }
    // quote
    const mk = (text, x, z, ry) => {
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: TX.labelTex(text), transparent: true, depthWrite: false }));
      sp.rotation.set(-Math.PI / 2, 0, ry); sp.position.set(x, 0.1, z); return sp;
    };
    const dims = new THREE.Group(); g.add(dims);
    dims.add(mk('22,00 m', 0, D / 2 + 2.2, 0), mk('13,00 m', W / 2 + 2.2, 0, Math.PI / 2));
    anim.push((t) => {
      const a = win(t, 1.0, 1.55), b = win(t, 1.3, 1.85);
      const fade = 1 - win(t, 3.0, 3.4);
      g.visible = t > 1.0 && fade > 0;
      lg.setDrawRange(0, Math.max(2, Math.ceil(a * 5)));
      M.oro.opacity = fade; axMat.opacity = 0.45 * b * fade;
      stakes.visible = a > 0.2; dims.visible = b > 0.1;
      dims.children.forEach((d) => { d.material.opacity = b * fade; });
    });
  }

  // ---------------- Fondazioni ----------------
  const Y0 = DIM.B; // estradosso platea
  {
    const magrone = new THREE.Mesh(box(W + 1.2, 0.1, D + 1.2, 0, -PD + 0.05, 0), M.magrone); magrone.receiveShadow = true; site.add(magrone);
    // armatura: rete di ferri
    const seg = []; const yR = -PD + 0.45;
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 0.5) seg.push(x, yR, -D / 2, x, yR, D / 2);
    for (let z = -D / 2; z <= D / 2 + 0.01; z += 0.5) seg.push(-W / 2, yR, z, W / 2, yR, z);
    for (const x of [-10.85, -5.425, 0, 5.425, 10.85]) for (const z of [-6.25, 0, 6.25]) for (const dx of [-0.1, 0.1]) seg.push(x + dx, yR, z, x + dx, yR + 1.6, z);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const rebar = new THREE.LineSegments(rg, M.ferro); site.add(rebar);
    const platea = grower(box(W + 0.6, 0.6, D + 0.6, 0, 0.3, 0), M.fondazione, 'fondazione', -PD + 0.1); building.add(platea);
    const wallsG = [];
    for (const s of SIDES) wallsG.push(...place([box(sideLen(s), 2.9, 0.3, 0, 1.45, 0)], s, -0.15));
    const bw = grower(merge(wallsG), M.fondazione, 'fondazione', -2.9); building.add(bw);
    anim.push((t) => {
      magrone.visible = t > 3.0; magrone.scale.set(Math.max(0.001, win(t, 3.0, 3.2)), 1, 1);
      rebar.visible = t > 3.15 && t < 3.95; rg.setDrawRange(0, Math.floor(seg.length / 3 * win(t, 3.15, 3.5)));
      show(platea, win(t, 3.45, 3.75));
      show(bw, win(t, 3.7, 4.0));
    });
  }

  // ---------------- Struttura in c.a. ----------------
  const XS = [-10.85, -5.425, 0, 5.425, 10.85], ZS = [-6.25, 0, 6.25];
  const floors = [];
  {
    const core = grower(merge([box(0.25, ROOF + 2.6 - Y0, 3.5, -1.6, (ROOF + 2.6 - Y0) / 2, -4.75), box(0.25, ROOF + 2.6 - Y0, 3.5, 1.6, (ROOF + 2.6 - Y0) / 2, -4.75),
      ...wallGeoms(3.45, ROOF + 2.6 - Y0, 0.25, [], 3).map((g) => g.translate(0, 0, -3.0))]), M.pilastro, 'pilastro', Y0);
    building.add(core);
    for (let k = 0; k < N; k++) {
      const cols = []; const hh = H - 0.25;
      for (const x of XS) for (const z of ZS) {
        if (Math.abs(x) < 1 && z < -3) continue;
        cols.push(box(0.3, hh, 0.5, x, hh / 2, z));
      }
      for (const z of ZS) cols.push(box(W, 0.45, 0.3, 0, hh - 0.22, z));
      for (const x of XS) cols.push(box(0.3, 0.45, D, x, hh - 0.22, 0));
      const m = grower(merge(cols), M.pilastro, 'pilastro', k * H); building.add(m);
      floors.push({ cols: m });
    }
    // casseforme in legno attorno al pilastro in getto
    const form = new THREE.Mesh(new THREE.BoxGeometry(0.5, H - 0.25, 0.7).translate(0, (H - 0.25) / 2, 0), M.tavole); site.add(form);
    anim.push((t) => {
      show(core, win(t, 4.0, 4.9));
      floors.forEach((f, k) => show(f.cols, win(t, 4.05 + k * 0.17, 4.3 + k * 0.17)));
      const kk = Math.min(N - 1, Math.floor(win(t, 4.05, 4.95) * N));
      form.visible = t > 4.05 && t < 4.95; form.position.set(XS[3], kk * H, ZS[2]);
    });
  }

  // ---------------- Solai ----------------
  {
    for (let k = 0; k <= N; k++) {
      const s = grower(box(W + 0.02, 0.25, D + 0.02, 0, -0.125, 0), M.solaio, 'solaio', k * H);
      s.position.y = k * H; building.add(s);
      const fn = (t) => { const p = win(t, 5.0 + k * 0.14, 5.3 + k * 0.14); show(s, p, 'x'); };
      anim.push(fn);
    }
  }

  // ---------------- Tamponature e tramezzi ----------------
  const wallMeshes = [];
  {
    for (let k = 0; k < N; k++) {
      const hh = H - 0.25; const gs = [];
      for (const s of SIDES) {
        const len = sideLen(s) - (s === 'left' || s === 'right' ? 0.6 : 0);
        gs.push(...place(wallGeoms(len, hh, 0.3, openingsFor(s, k)), s, -0.15));
      }
      const w = grower(merge(gs), M.parete, 'parete', k * H); building.add(w); wallMeshes.push(w);
      // tramezzi: parete tra alloggi (x=0) e corridoio, divisori camere
      const tg = [box(0.25, hh, 9.2, 0, hh / 2, 1.6), box(9.2, hh, 0.12, -6.2, hh / 2, -2.9), box(9.2, hh, 0.12, 6.2, hh / 2, -2.9),
        box(0.12, hh, 3.6, -5.425, hh / 2, -4.7), box(0.12, hh, 3.6, 5.425, hh / 2, -4.7)];
      const tr = grower(merge(tg), M.tramezzo, 'tramezzo', k * H); building.add(tr); wallMeshes.push(tr);
      anim.push((t) => { show(w, win(t, 6.0 + k * 0.16, 6.35 + k * 0.16)); show(tr, win(t, 6.2 + k * 0.15, 6.5 + k * 0.15)); });
    }
    // vista "a raggi X" durante gli impianti
    anim.push((t) => {
      const x = win(t, 7.0, 7.15) * (1 - win(t, 7.85, 8.0));
      const o = 1 - x * 0.82;
      for (const mat of [M.parete, M.tramezzo]) { mat.opacity = o; mat.depthWrite = o > 0.99; }
    });
  }

  // ---------------- Impianti ----------------
  {
    const pipes = [];
    const tube = (x, y, z, len, axis, mat, r = 0.11) => {
      const g = new THREE.CylinderGeometry(r, r, len, 8);
      if (axis === 'y') g.translate(0, len / 2, 0);
      if (axis === 'x') { g.translate(0, len / 2, 0); g.rotateZ(-Math.PI / 2); }
      if (axis === 'z') { g.translate(0, len / 2, 0); g.rotateX(Math.PI / 2); }
      const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.userData.part = 'impianti'; m.userData.axis = axis; building.add(m); pipes.push(m); return m;
    };
    const risers = [[-2.1, M.impianti], [-2.4, M.impiantiBlu], [2.1, M.impiantiRosso], [2.4, M.impiantiOro]];
    risers.forEach(([x, mat], i) => { const m = tube(x, Y0, -3.3, ROOF - Y0, 'y', mat, 0.14); m.userData.delay = i * 0.03; m.userData.d = 0; });
    for (let k = 0; k < N; k++) {
      const y = k * H + 0.12;
      for (const sgn of [-1, 1]) {
        const a = tube(sgn * 2.3, y, -2.6, 7.5, 'x', sgn < 0 ? M.impiantiBlu : M.impiantiRosso); if (sgn < 0) { a.rotation.y = Math.PI; }
        a.userData.delay = 0.15 + k * 0.1;
        const b = tube(sgn * 8.2, y, -2.6, 8, 'z', M.impianti, 0.1); b.userData.delay = 0.25 + k * 0.1;
        const c = tube(sgn * 3.8, y + 2.3, -2.4, 6.5, 'x', M.impiantiOro, 0.06); if (sgn < 0) c.rotation.y = Math.PI; c.userData.delay = 0.3 + k * 0.1;
      }
    }
    anim.push((t) => {
      const fade = 1 - win(t, 9.6, 9.9);
      for (const m of pipes) {
        const p = win(t, 7.05 + m.userData.delay, 7.45 + m.userData.delay) * fade;
        m.visible = p > 0.001;
        const s = Math.max(easeOut(p), 0.0001);
        m.scale.set(m.userData.axis === 'x' ? s : 1, m.userData.axis === 'y' ? s : 1, m.userData.axis === 'z' ? s : 1);
      }
    });
  }

  // ---------------- Copertura e fotovoltaico ----------------
  {
    const ins = grower(box(W, 0.2, D, 0, 0.1, 0), M.copertura, 'copertura', ROOF); building.add(ins);
    const par = [];
    for (const s of SIDES) par.push(...place([box(sideLen(s) + 0.4, 1.0, 0.2, 0, 0.5, 0)], s, 0.1));
    const parapet = grower(merge(par), M.fasce, 'copertura', ROOF + 0.2); building.add(parapet);
    const housing = grower(box(3.45, 2.4, 3.5, 0, 1.2, -4.75), M.facciata, 'copertura', ROOF + 0.2); building.add(housing);
    const panels = [];
    const pg = new THREE.BoxGeometry(1.7, 0.05, 1.0);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const p = new THREE.Mesh(pg, M.fotovoltaico); p.userData.part = 'fotovoltaico';
      p.position.set(-8 + i * 4, ROOF + 0.75, -0.6 + j * 1.35); p.castShadow = true; p.userData.d = (i + j) * 0.02; building.add(p); panels.push(p);
    }
    anim.push((t) => {
      show(ins, win(t, 8.0, 8.3)); show(parapet, win(t, 8.15, 8.45)); show(housing, win(t, 8.2, 8.5));
      for (const p of panels) {
        const q = win(t, 8.45 + p.userData.d, 8.65 + p.userData.d); p.visible = q > 0.001;
        p.rotation.x = -0.18 - (1 - easeOut(q)) * 1.4; p.position.y = ROOF + 0.75 + (1 - easeOut(q)) * 2.5; p.scale.setScalar(Math.max(easeOut(q), 0.001));
      }
    });
  }

  // ---------------- Facciata, cappotto, serramenti, balconi ----------------
  const windowsGlow = [];
  {
    for (let k = 0; k < N; k++) {
      const hh = H; const gs = []; const fr = []; const gl = [];
      for (const s of SIDES) {
        const len = sideLen(s) + 0.24;
        const ops = openingsFor(s, k).map((o) => ({ ...o, h: o.h + (k === 0 ? 0 : 0) }));
        gs.push(...place(wallGeoms(len, hh - 0.3, 0.12, ops, 2).map((g) => g.translate(0, 0, 0)), s, 0.06));
        // telai e vetri
        for (const o of ops) {
          const fl = [box(o.w, 0.08, 0.14, o.c, o.sill + 0.04, 0, 1), box(o.w, 0.08, 0.14, o.c, o.sill + o.h - 0.04, 0, 1), box(0.08, o.h, 0.14, o.c - o.w / 2 + 0.04, o.sill + o.h / 2, 0, 1), box(0.08, o.h, 0.14, o.c + o.w / 2 - 0.04, o.sill + o.h / 2, 0, 1)];
          if (o.w > 2) fl.push(box(0.06, o.h, 0.1, o.c, o.sill + o.h / 2, 0, 1));
          fr.push(...place(fl, s, -0.05));
          gl.push(...place([box(o.w - 0.1, o.h - 0.1, 0.02, o.c, o.sill + o.h / 2, 0, 1)], s, -0.06));
          windowsGlow.push({ side: s, k, o });
        }
      }
      const capp = grower(merge(gs), M.facciata, 'parete', k * H); building.add(capp);
      const frames = grower(merge(fr), M.telaio, 'serramento', k * H); building.add(frames);
      const glass = grower(merge(gl), M.vetro, 'serramento', k * H); building.add(glass);
      anim.push((t) => {
        show(capp, win(t, 9.0 + k * 0.08, 9.3 + k * 0.08));
        const q = win(t, 9.4 + k * 0.06, 9.6 + k * 0.06); frames.visible = glass.visible = q > 0.01;
        frames.scale.setScalar(1); glass.scale.set(1, Math.max(q, 0.001), 1);
      });
    }
    // fasce marcapiano bianche
    const bands = [];
    for (let k = 1; k <= N; k++) for (const s of SIDES) bands.push(...place([box(sideLen(s) + 0.5, 0.32, 0.25, 0, k * H - 0.16, 0, 2)], s, 0.18));
    const bandM = grower(merge(bands), M.fasce, 'parete', 0); building.add(bandM);
    // balconi e parapetti in vetro
    const bal = [], rail = [], railTop = [];
    for (let k = 1; k < N; k++) for (const [x0, x1] of [[-11.1, -0.35], [0.35, 11.1]]) {
      const w = x1 - x0, cx = (x0 + x1) / 2, dz = 1.7;
      bal.push(box(w, 0.22, dz, cx, k * H - 0.11, D / 2 + 0.15 + dz / 2, 2));
      rail.push(box(w, 1.0, 0.03, cx, k * H + 0.5, D / 2 + 0.15 + dz - 0.05, 1), box(0.03, 1.0, dz, x0 + 0.02, k * H + 0.5, D / 2 + 0.15 + dz / 2, 1), box(0.03, 1.0, dz, x1 - 0.02, k * H + 0.5, D / 2 + 0.15 + dz / 2, 1));
      railTop.push(box(w, 0.05, 0.06, cx, k * H + 1.02, D / 2 + 0.15 + dz - 0.05, 1));
    }
    const balM = grower(merge(bal), M.balcone, 'balcone', 0); building.add(balM);
    const railM = grower(merge(rail), M.parapetto, 'balcone', 0); railM.castShadow = false; building.add(railM);
    const railTM = grower(merge(railTop), M.telaio, 'balcone', 0); building.add(railTM);
    // lamella verticale oro sul vano scala (firma del marchio)
    const fin = grower(box(0.18, ROOF + 1.5, 0.35, 0, (ROOF + 1.5) / 2, D / 2 + 0.3, 2), new THREE.MeshStandardMaterial({ color: '#DF9526', metalness: 0.85, roughness: 0.3 }), 'facciata-oro', 0);
    building.add(fin);
    anim.push((t) => {
      show(bandM, win(t, 9.1, 9.5), 'x');
      show(balM, win(t, 9.2, 9.55), 'x');
      show(railM, win(t, 9.6, 9.85)); show(railTM, win(t, 9.6, 9.85));
      show(fin, win(t, 9.7, 10.0));
    });
  }

  // ---------------- Finiture interne ----------------
  {
    const floorG = [], furn = [], dark = [], lights = [];
    for (let k = 0; k < N; k++) {
      const y = k * H;
      floorG.push(box(W - 0.6, 0.03, D - 0.6, 0, y + 0.015, 0, 1.6));
      for (const sx of [-1, 1]) {
        furn.push(box(2.4, 0.42, 0.95, sx * 7.8, y + 0.21, 0.4), box(2.4, 0.8, 0.22, sx * 7.8, y + 0.4, -0.05)); // divano
        furn.push(box(1.6, 0.06, 0.9, sx * 3.2, y + 0.75, 1.2), box(0.08, 0.72, 0.08, sx * 3.2, y + 0.36, 1.2)); // tavolo
        dark.push(box(3.2, 0.9, 0.62, sx * 3.5, y + 0.45, -2.45), box(0.6, 2.2, 0.62, sx * 1.7, y + 1.1, -2.45)); // cucina
        dark.push(box(1.6, 0.5, 0.9, sx * 7.8, y + 0.25, 2.2)); // mobile tv
        lights.push(box(1.2, 0.02, 1.2, sx * 7.8, y + H - 0.27, 0.8), box(1.2, 0.02, 1.2, sx * 3.2, y + H - 0.27, 1.2), box(1.6, 0.02, 0.5, sx * 3.5, y + H - 0.27, -2.2));
      }
    }
    const fl = grower(merge(floorG), M.pavimento, 'pavimento', 0); building.add(fl);
    const fu = grower(merge(furn), M.arredo, 'arredo', 0); building.add(fu);
    const fd = grower(merge(dark), M.arredoScuro, 'arredo', 0); building.add(fd);
    const li = grower(merge(lights), M.luce, 'arredo', 0); li.castShadow = false; building.add(li);
    anim.push((t, ctx) => {
      fl.visible = t > 10.15; fu.visible = fd.visible = t > 10.35; li.visible = t > 10.3;
      const p = win(t, 10.15, 10.4); fl.scale.set(Math.max(p, 0.001), 1, 1);
      const q = win(t, 10.35, 10.7); fu.scale.set(1, Math.max(q, 0.001), 1); fd.scale.set(1, Math.max(q, 0.001), 1);
      M.luce.emissiveIntensity = win(t, 10.5, 10.8) * (0.5 + ctx.night * 0.9);
    });
  }

  // Finestre illuminate (una per una alla consegna).
  {
    const g = new THREE.PlaneGeometry(1, 1); const n = windowsGlow.length;
    const inst = new THREE.InstancedMesh(g, M.glow, n); inst.frustumCulled = false;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    const order = windowsGlow.map((_, i) => i).sort(() => R() - 0.5);
    const delays = new Float32Array(n); order.forEach((idx, i) => { delays[idx] = i / n; });
    windowsGlow.forEach((wg, i) => {
      const { side, k, o } = wg; const yy = k * H + o.sill + o.h / 2; let x = 0, z = 0, ry = 0; const off = -0.03;
      if (side === 'front') { x = o.c; z = D / 2 + off; ry = 0; }
      if (side === 'back') { x = -o.c; z = -D / 2 - off; ry = Math.PI; }
      if (side === 'left') { z = o.c; x = -W / 2 - off; ry = -Math.PI / 2; }
      if (side === 'right') { z = -o.c; x = W / 2 + off; ry = Math.PI / 2; }
      p.set(x, yy, z); e.set(0, ry, 0); q.setFromEuler(e); s.set(o.w - 0.15, o.h - 0.15, 1);
      m4.compose(p, q, s); inst.setMatrixAt(i, m4);
      inst.setColorAt(i, new THREE.Color(R() > 0.3 ? '#ffc47a' : '#ffd9a8'));
    });
    building.add(inst);
    const base = new THREE.Color();
    anim.push((t, ctx) => {
      const on = win(t, 11.25, 11.9);
      inst.visible = on > 0 || t > 10.5;
      M.glow.opacity = 0.9;
      for (let i = 0; i < n; i++) {
        const v = clamp01((on - delays[i] * 0.85) / 0.15) * (0.25 + ctx.night * 0.75) + win(t, 10.5, 10.9) * 0.12 * ctx.night;
        base.set('#ffbf73').multiplyScalar(Math.min(1, v));
        inst.setColorAt(i, base);
      }
      inst.instanceColor.needsUpdate = true;
    });
  }

  // ---------------- Esterni e consegna ----------------
  {
    const paving = new THREE.Mesh(merge([box(W + 8, 0.06, 3.6, 0, 0.03, D / 2 + 3.2 + 0.4, 2), box(W + 8, 0.06, 2.4, 0, 0.03, -D / 2 - 1.6, 2), box(2.4, 0.06, D, -W / 2 - 2.8, 0.03, 0, 2), box(2.4, 0.06, D, W / 2 + 2.8, 0.03, 0, 2)]), M.pietra);
    paving.receiveShadow = true; site.add(paving);
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#36412b', roughness: 1 }));
    lawn.position.set(0, 0.015, 0); lawn.receiveShadow = true; site.add(lawn);
    const trees = []; const tg = new THREE.CylinderGeometry(0.12, 0.18, 2.4, 6).translate(0, 1.2, 0); const fg = new THREE.IcosahedronGeometry(1.6, 0).translate(0, 3.2, 0);
    const spots = [[-15, 10], [-8, 11.5], [8, 11.5], [15, 10], [-16, -2], [16, -3], [-14, -11], [14, -11], [0, 13], [-20, 4], [20, 5]];
    for (const [x, z] of spots) {
      const g = new THREE.Group(); const tr = new THREE.Mesh(tg, M.tronco); const f = new THREE.Mesh(fg, M.foglie);
      f.scale.set(1, 1.15, 1).multiplyScalar(0.8 + R() * 0.5); f.rotation.y = R() * 6; tr.castShadow = f.castShadow = true; g.add(tr, f);
      g.position.set(x, 0, z); site.add(g); trees.push(g); g.userData.d = R() * 0.4;
    }
    // muretto e ringhiera di recinzione
    const fenceG = [box(48, 0.8, 0.3, 0, 0.4, 15), box(48, 0.8, 0.3, 0, 0.4, -15), box(0.3, 0.8, 30, -24, 0.4, 0), box(0.3, 0.8, 30, 24, 0.4, 0)].map((g) => g);
    const fence = new THREE.Mesh(merge(fenceG), M.fasce); fence.castShadow = true; site.add(fence);
    const bolG = []; for (let i = -5; i <= 5; i++) if (i !== 0) bolG.push(box(0.12, 0.6, 0.12, i * 2.2, 0.3, D / 2 + 5.4, 1));
    const bollards = new THREE.Mesh(merge(bolG), M.luce); site.add(bollards);
    anim.push((t, ctx) => {
      M.vicini.emissiveIntensity = ctx.night * 0.9;
      const p = win(t, 11.0, 11.3); paving.visible = lawn.visible = fence.visible = bollards.visible = p > 0.01;
      lawn.scale.setScalar(Math.max(p, 0.001)); paving.scale.set(Math.max(p, 0.001), 1, 1); fence.scale.set(1, Math.max(p, 0.001), 1);
      for (const g of trees) { const q = win(t, 11.15 + g.userData.d, 11.55 + g.userData.d); g.visible = q > 0.01; g.scale.setScalar(Math.max(easeOut(q), 0.001)); }
    });
  }

  // ---------------- Contesto: colline, mare ed edifici vicini ----------------
  {
    const hills = new THREE.Group(); root.add(hills);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + R() * 0.2, r = 190 + R() * 70;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z < -90 && Math.abs(x) < 210) continue; // dietro l'edificio si apre il mare
      const h = new THREE.Mesh(new THREE.ConeGeometry(60 + R() * 50, 22 + R() * 36, 7), M.colline);
      h.position.set(x, -2, z); h.scale.z = 0.6 + R() * 0.6; hills.add(h);
    }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 320).rotateX(-Math.PI / 2), M.mare);
    sea.position.set(0, -0.6, -265); root.add(sea);
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(900, 14).rotateX(-Math.PI / 2), M.sabbia);
    beach.position.set(0, -0.3, -108); root.add(beach);
    // palazzine vicine, basse e lontane, con finestre che si accendono la sera
    const nb = [];
    const spots = [[-46, -44, 16, 12, 12], [-14, -58, 20, 12, 15], [22, -52, 16, 12, 18], [52, -40, 14, 14, 9], [-62, -10, 12, 18, 15], [64, -12, 12, 16, 12], [-60, 28, 14, 12, 9], [62, 30, 16, 12, 12]];
    for (const [x, z, w, d, h] of spots) nb.push(box(w, h, d, x, h / 2, z, 1));
    const g = merge(nb);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 12, uv.getY(i) / 12.4);
    const n = new THREE.Mesh(g, M.vicini); n.receiveShadow = true; n.castShadow = quality.high; root.add(n);
  }

  // ---------------- Cantiere: gru, ponteggi, recinzione ----------------
  const crane = new THREE.Group(); site.add(crane); crane.position.set(-18, 0, -12);
  let cranePivot;
  {
    const mastH = 34;
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.6, mastH, 1.6).translate(0, mastH / 2, 0), M.gru);
    const gu = mast.geometry.attributes.uv; for (let i = 0; i < gu.count; i++) gu.setY(i, gu.getY(i) * mastH / 1.6);
    mast.castShadow = true; crane.add(mast);
    const baseB = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4).translate(0, 0.5, 0), M.fondazione); crane.add(baseB);
    cranePivot = new THREE.Group(); cranePivot.position.y = mastH; crane.add(cranePivot);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(32, 1.3, 1.3).translate(16, 0.65, 0), M.gru);
    const ju = jib.geometry.attributes.uv; for (let i = 0; i < ju.count; i++) ju.setX(i, ju.getX(i) * 32 / 1.3);
    jib.castShadow = true; cranePivot.add(jib);
    const cj = new THREE.Mesh(new THREE.BoxGeometry(10, 1.0, 1.3).translate(-5, 0.5, 0), M.gruPieno); cranePivot.add(cj);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 2).translate(-8.5, -0.8, 0), M.fondazione); cranePivot.add(cw);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8).translate(0.9, -0.4, 1.5), M.gruPieno); cranePivot.add(cab);
    const apex = new THREE.Mesh(new THREE.ConeGeometry(1.0, 6, 4).translate(0, 4, 0), M.gru); cranePivot.add(apex);
    const tie = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 7, 0), new THREE.Vector3(22, 1.3, 0), new THREE.Vector3(0, 7, 0), new THREE.Vector3(-9, 1, 0)]), new THREE.LineBasicMaterial({ color: '#2b2b2b' }));
    cranePivot.add(tie);
    const trolley = new THREE.Group(); trolley.position.set(20, 0, 0); cranePivot.add(trolley);
    const cable = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(-0.2, -14, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0.2, -14, 0)]), new THREE.LineBasicMaterial({ color: '#222' }));
    trolley.add(cable);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5).translate(0, -14.4, 0), M.recinzione); trolley.add(hook);
    const load = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 5).rotateZ(Math.PI / 2).translate(0, -15.2, 0), M.ferro.clone()); load.material = new THREE.MeshStandardMaterial({ color: '#8b4f2c', metalness: 0.6, roughness: 0.6 }); trolley.add(load);
    crane.userData.trolley = trolley; crane.userData.cable = cable; crane.userData.hook = hook; crane.userData.load = load;
  }
  // ponteggi (istanziati e ordinati per quota: si "montano" seguendo la costruzione)
  const scaff = { tubes: null, planks: null, yT: [], yP: [] };
  {
    const T = [], P = []; const off = 1.0, offF = 2.2, hMax = ROOF + 1.5;
    const ring = [];
    const addLine = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0); const n = Math.max(1, Math.round(L / 2.0)); for (let i = 0; i <= n; i++) ring.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, x1 - x0, z1 - z0]); };
    const fx = W / 2 + off, bz = -D / 2 - off, fz = D / 2 + offF;
    addLine(-fx, fz, fx, fz); addLine(fx, fz, fx, bz); addLine(fx, bz, -fx, bz); addLine(-fx, bz, -fx, fz);
    for (const [x, z] of ring) for (let y = 0; y < hMax; y += 2) T.push({ p: [x, y + 1, z], s: [0.06, 2, 0.06], y });
    for (let y = 2; y < hMax; y += 2) {
      for (const [x0, z0, x1, z1, len] of [[-fx, fz, fx, fz, 2 * fx], [fx, fz, fx, bz, fz - bz], [fx, bz, -fx, bz, 2 * fx], [-fx, bz, -fx, fz, fz - bz]]) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, along = Math.abs(x1 - x0) > 0.1;
        T.push({ p: [cx, y + 1, cz], s: along ? [len, 0.05, 0.05] : [0.05, 0.05, len], y });
        P.push({ p: [cx + (along ? 0 : (x0 > 0 ? -0.4 : 0.4)), y, cz + (along ? (z0 > 0 ? -0.4 : 0.4) : 0)], s: along ? [len, 0.05, 0.8] : [0.8, 0.05, len], y });
      }
    }
    const mk = (list, mat) => {
      list.sort((a, b) => a.y - b.y);
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      list.forEach((it, i) => { m4.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s)); im.setMatrixAt(i, m4); });
      im.castShadow = true; site.add(im); return im;
    };
    scaff.tubes = mk(T, M.acciaio); scaff.yT = T.map((i) => i.y);
    scaff.planks = mk(P, M.tavole); scaff.yP = P.map((i) => i.y);
  }
  // recinzione di cantiere con il marchio
  const hoarding = new THREE.Group(); site.add(hoarding);
  {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#1c1d1a'; x.fillRect(0, 0, 1024, 128); x.fillStyle = '#DF9526'; x.fillRect(0, 118, 1024, 10);
    x.font = '800 54px "Archivo", sans-serif'; x.fillText('EL.AN.', 40, 80); x.font = '500 26px "IBM Plex Mono", monospace'; x.fillStyle = '#b9b4a9'; x.fillText('COSTRUZIONI RESIDENZIALI · CANTIERE IN CORSO', 300, 76);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping;
    const hm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
    for (const [len, px, pz, ry] of [[46, 0, 16, 0], [46, 0, -16, Math.PI], [32, -23, 0, -Math.PI / 2], [32, 23, 0, Math.PI / 2]]) {
      const g = new THREE.PlaneGeometry(len, 2.2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 16);
      const m = new THREE.Mesh(g, hm); m.position.set(px, 1.1, pz); m.rotation.y = ry; hoarding.add(m);
      const back = m.clone(); back.rotation.y += Math.PI; back.position.multiplyScalar(1.0005); hoarding.add(back);
    }
  }

  // stato del cantiere (gru e ponteggi)
  const siteState = (t, ctx) => {
    const auto = t > 1.6 && t < 10.6;
    const forced = ctx.cantiere;
    hoarding.visible = (t > 1.2 && t < 10.9) || forced;
    // gru
    const cIn = win(t, 2.0, 2.6), cOut = 1 - win(t, 10.0, 10.5);
    const cv = forced ? 1 : Math.min(cIn, cOut);
    crane.visible = cv > 0.01; crane.scale.set(1, Math.max(cv, 0.001), 1);
    cranePivot.rotation.y = 0.9 + Math.sin(ctx.time * 0.12) * 0.5 + t * 0.35;
    const tr = crane.userData.trolley; tr.position.x = 14 + Math.sin(ctx.time * 0.2 + 1) * 6;
    // ponteggi
    let hS = 0;
    if (auto) hS = ROOF * win(t, 4.0, 5.0) + 1.5 * win(t, 5.0, 5.4);
    if (t > 9.75) hS *= 1 - win(t, 9.75, 10.2);
    if (forced) hS = Math.max(hS, (t < 4 ? ROOF : ROOF) + 1.5);
    const cnt = (ys) => { let c = 0; while (c < ys.length && ys[c] < hS - 0.01) c++; return c; };
    scaff.tubes.count = cnt(scaff.yT); scaff.planks.count = cnt(scaff.yP);
    scaff.tubes.visible = scaff.tubes.count > 0; scaff.planks.visible = scaff.planks.count > 0;
  };

  return {
    root, building, crane,
    update(t, ctx) { for (const f of anim) f(t, ctx); siteState(t, ctx); },
  };
}
