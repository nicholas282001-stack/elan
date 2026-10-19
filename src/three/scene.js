// Esperienza 3D: scena, luce del giorno, telecamera guidata dallo scroll, interazioni.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, makeMaterials, ROOF } from './building.js';

const lerp = (a, b, p) => a + (b - a) * p;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (p) => p * p * (3 - 2 * p);

// Telecamera per capitolo: azimut, elevazione (gradi), distanza, quota del punto guardato.
const CAM = [
  [38, 16, 46, 4.5],   // 0 edificio esistente
  [18, 58, 50, 0],     // 1 rilievo
  [42, 36, 46, -1],    // 2 scavo
  [58, 30, 40, -1.5],  // 3 fondazioni
  [30, 17, 50, 6],     // 4 struttura
  [8, 32, 52, 8],      // 5 solai
  [-22, 14, 50, 8],    // 6 tamponature
  [-34, 12, 38, 7],    // 7 impianti
  [-12, 46, 50, 13],   // 8 copertura
  [24, 8, 50, 8],      // 9 facciata
  [34, 12, 36, 6.5],   // 10 finiture (spaccato)
  [28, 8, 54, 7.5],    // 11 consegna
  [20, 7, 74, 10],     // 12 fine
];

// Luce del giorno lungo la storia: alba -> giorno -> tramonto -> sera.
const SKY = [
  { t: 0, top: '#2a3550', hor: '#e2a27a', sunEl: 5, sunAz: 70, sun: '#ffb27a', I: 1.7, hemi: 0.55, env: 0.35, exp: 0.95 },
  { t: 2.5, top: '#5d7fa6', hor: '#e6d3b8', sunEl: 28, sunAz: 55, sun: '#ffe0bb', I: 2.8, hemi: 0.8, env: 0.55, exp: 1.0 },
  { t: 6, top: '#6f90b6', hor: '#dfe1dc', sunEl: 55, sunAz: 30, sun: '#fff3e2', I: 3.1, hemi: 0.9, env: 0.6, exp: 1.0 },
  { t: 9, top: '#46557a', hor: '#efae6c', sunEl: 15, sunAz: -10, sun: '#ffb466', I: 2.6, hemi: 0.6, env: 0.45, exp: 1.0 },
  { t: 10.6, top: '#1c2140', hor: '#c26c55', sunEl: 3, sunAz: -25, sun: '#ff8a52', I: 1.3, hemi: 0.4, env: 0.3, exp: 1.05 },
  { t: 12, top: '#070a14', hor: '#2e2c48', sunEl: 24, sunAz: -60, sun: '#8ea4ff', I: 0.6, hemi: 0.34, env: 0.24, exp: 1.2 },
];
const LABELS = [[0, '06:10', 'alba'], [1.5, '07:30', 'mattino'], [4, '10:00', 'mattino'], [6, '13:00', 'mezzogiorno'], [8, '16:30', 'pomeriggio'], [9.5, '18:40', 'tramonto'], [10.8, '20:15', 'sera'], [11.6, '21:30', 'sera']];

function skyAt(t) {
  let i = 0; while (i < SKY.length - 2 && t > SKY[i + 1].t) i++;
  const a = SKY[i], b = SKY[i + 1]; const p = smooth(clamp((t - a.t) / (b.t - a.t), 0, 1));
  const c = (k) => new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), p);
  const n = (k) => lerp(a[k], b[k], p);
  return { top: c('top'), hor: c('hor'), sun: c('sun'), sunEl: n('sunEl'), sunAz: n('sunAz'), I: n('I'), hemi: n('hemi'), env: n('env'), exp: n('exp') };
}

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, night: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){
        float y = clamp(vP.y, -0.2, 1.0);
        vec3 c = mix(hor, top, pow(max(y,0.), 0.55));
        c = mix(c, hor*0.55, smoothstep(0.0, -0.2, y));
        float s = max(dot(normalize(vP), normalize(sunDir)), 0.);
        c += sunCol * (pow(s, 900.) * 3. + pow(s, 12.) * .35) * (1. - night*.8);
        vec3 q = floor(vP * 420.); float st = step(0.9975, h(q)) * smoothstep(0.05, 0.4, y) * night;
        c += vec3(st);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
}

// Taglio di sezione: le facce interne tagliate appaiono in oro, come il campito di una sezione.
function addPoche(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n if(!gl_FrontFacing) gl_FragColor = vec4(0.875, 0.584, 0.149, 1.0);');
  };
  mat.customProgramCacheKey = () => 'poche';
}

export async function createExperience({ canvas, quality, onProgress = () => {} }) {
  onProgress(0.1);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: !!quality.capture });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;
  let dpr = Math.min(window.devicePixelRatio || 1, quality.maxDpr);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 900);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  onProgress(0.3);
  await new Promise((r) => setTimeout(r, 0));

  const sky = makeSky(); scene.add(sky);
  scene.fog = new THREE.Fog('#888', 90, 330);
  const sun = new THREE.DirectionalLight('#fff', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadow, quality.shadow);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 220 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#cfd8e6', '#3a3128', 0.7); scene.add(hemi);
  const warm = new THREE.PointLight('#ffb870', 0, 60, 1.6); warm.position.set(0, 6, 14); scene.add(warm);

  const M = makeMaterials();
  onProgress(0.55);
  await new Promise((r) => setTimeout(r, 0));
  const world = buildWorld(M, quality);
  scene.add(world.root);
  onProgress(0.8);

  // Materiali dell'edificio: piano di taglio + campitura oro.
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 60);
  const bMats = new Set();
  world.building.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => bMats.add(m)); });
  bMats.forEach((m) => { m.clippingPlanes = [clip]; addPoche(m); });

  // Post-produzione: bagliore delle luci la sera (solo dispositivi potenti).
  let composer = null, bloom = null;
  if (quality.bloom) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.6, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---------------- stato ----------------
  const S = {
    t: 0, target: 0, w: 1, h: 1, time: 0, active: true, frame: 0,
    section: false, sectionAmt: 0, cantiere: false, explore: false,
    az: 0, el: 0, zoom: 1, uAz: 0, uEl: 0, uZoom: 1, highlight: null, hiAmt: 0,
    layout: 'right', // dove sta l'edificio rispetto al testo
  };
  const ctx = { night: 0, time: 0, cantiere: false };

  function camAt(t) {
    const i = clamp(Math.floor(t), 0, CAM.length - 2), p = smooth(clamp(t - i, 0, 1));
    const a = CAM[i], b = CAM[i + 1];
    return a.map((v, k) => lerp(v, b[k], p));
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    S.w = Math.max(1, r.width); S.h = Math.max(1, r.height);
    renderer.setSize(S.w, S.h, false);
    camera.aspect = S.w / S.h; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(S.w, S.h); composer.setPixelRatio(dpr); bloom.resolution.set(S.w / 2, S.h / 2); }
  }

  function applyView() {
    let [az, el, dist, ty] = camAt(S.t);
    const portrait = S.w / S.h < 0.9;
    az += S.az; el = clamp(el + S.el, 2, 80); dist *= S.zoom;
    if (portrait) dist *= 1.75 + (0.9 - S.w / S.h) * 0.6;
    const a = THREE.MathUtils.degToRad(az + Math.sin(S.time * 0.05) * 1.5), e = THREE.MathUtils.degToRad(el);
    camera.position.set(Math.sin(a) * Math.cos(e) * dist, ty + Math.sin(e) * dist, Math.cos(a) * Math.cos(e) * dist);
    camera.lookAt(0, ty, 0);
    // sposta l'edificio a lato del testo senza muovere la telecamera
    const w = S.w, h = S.h;
    if (S.layout === 'right' && !portrait) camera.setViewOffset(w, h, -w * (0.17 + 0.07 * Math.max(0, S.t - 11)), 0, w, h);
    else if (portrait) camera.setViewOffset(w, h, 0, h * 0.14, w, h);
    else camera.clearViewOffset();
  }

  function applyLight() {
    const k = skyAt(S.t);
    const night = clamp((S.t - 10.2) / 1.6, 0, 1);
    ctx.night = night;
    sky.material.uniforms.top.value.copy(k.top); sky.material.uniforms.hor.value.copy(k.hor);
    sky.material.uniforms.sunCol.value.copy(k.sun); sky.material.uniforms.night.value = night;
    const el = THREE.MathUtils.degToRad(k.sunEl), az = THREE.MathUtils.degToRad(k.sunAz);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    sky.material.uniforms.sunDir.value.copy(dir);
    sun.position.copy(dir).multiplyScalar(120); sun.color.copy(k.sun); sun.intensity = k.I;
    hemi.intensity = k.hemi; hemi.color.copy(k.top).lerp(new THREE.Color('#ffffff'), 0.5);
    scene.environmentIntensity = k.env;
    scene.fog.color.copy(k.hor).multiplyScalar(0.9);
    renderer.toneMappingExposure = k.exp;
    warm.intensity = night * 30;
    if (bloom) { bloom.strength = 0.12 + night * 0.38; bloom.threshold = 0.9 - night * 0.12; }
  }

  function applyState(dt) {
    ctx.time = S.time; ctx.cantiere = S.cantiere;
    world.update(S.t, ctx);
    // sezione: automatica durante le finiture o richiesta dall'utente
    const want = S.section || (S.t > 10.05 && S.t < 10.95);
    S.sectionAmt = lerp(S.sectionAmt, want ? 1 : 0, dt === 0 ? 1 : 1 - Math.exp(-dt * 5));
    clip.constant = lerp(60, 3.0, smooth(S.sectionAmt));
    const two = S.sectionAmt > 0.01;
    bMats.forEach((m) => { const side = two ? THREE.DoubleSide : THREE.FrontSide; if (m.side !== side) { m.side = side; m.needsUpdate = true; } });
    // evidenziazione dell'elemento selezionato
    S.hiAmt = lerp(S.hiAmt, S.highlight ? 1 : 0, 0.15);
    const pulse = 0.25 + Math.sin(S.time * 4) * 0.12;
    bMats.forEach((m) => {
      if (!m.emissive || m === M.luce || m === M.impiantiOro) return;
      const on = !!(S.highlight && m.userData.parts && [...m.userData.parts].some((x) => S.highlight.has(x)));
      m.emissive.set(on ? '#DF9526' : '#000000'); m.emissiveIntensity = on ? pulse * S.hiAmt * 2 : 0;
    });
  }
  // a quali "parti" appartiene ciascun materiale
  world.building.traverse((o) => {
    if (o.isMesh && o.userData.part) { const m = o.material; m.userData.parts = m.userData.parts || new Set(); m.userData.parts.add(o.userData.part); }
  });

  function render() { if (composer) composer.render(); else renderer.render(scene, camera); }

  // ---------------- ciclo ----------------
  let last = performance.now(), slow = 0, raf = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!S.active || document.hidden) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    S.time += dt;
    const k = 1 - Math.exp(-dt * (quality.reduced ? 30 : 4.5));
    S.t = lerp(S.t, S.target, k); if (Math.abs(S.t - S.target) < 0.0005) S.t = S.target;
    if (!S.explore) { S.uAz *= 0.94; S.uEl *= 0.94; S.uZoom = lerp(S.uZoom, 1, 0.06); }
    S.az = lerp(S.az, S.uAz, 0.12); S.el = lerp(S.el, S.uEl, 0.12); S.zoom = lerp(S.zoom, S.uZoom, 0.12);
    applyState(dt); applyLight(); applyView(); render();
    // qualita' adattiva: se il frame e' lento riduce la risoluzione
    if (dt > 0.034) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 40 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); slow = 0; }
  }

  resize();
  applyState(0); applyLight(); applyView();
  // compila gli shader prima di mostrare la scena
  S.t = 12; S.target = 12; applyState(0); renderer.compile(scene, camera);
  onProgress(0.95);
  render();
  raf = requestAnimationFrame(loop);
  onProgress(1);

  const ray = new THREE.Raycaster(); const v2 = new THREE.Vector2();

  return {
    setTarget(t) { S.target = clamp(t, 0, 12); },
    jump(t) { S.target = S.t = clamp(t, 0, 12); },
    get t() { return S.t; },
    setLayout(l) { S.layout = l; },
    setSection(v) { S.section = v; },
    setCantiere(v) { S.cantiere = v; },
    setExplore(v) { S.explore = v; },
    rotate(dAz, dEl) { S.uAz = clamp(S.uAz + dAz, -170, 170); S.uEl = clamp(S.uEl + dEl, -15, 45); },
    zoomBy(f) { S.uZoom = clamp(S.uZoom * f, 0.45, 1.6); },
    resetView() { S.uAz = 0; S.uEl = 0; S.uZoom = 1; },
    setActive(v) { S.active = v; },
    highlight(parts) { S.highlight = parts ? new Set([].concat(parts)) : null; },
    timeLabel() { let l = LABELS[0]; for (const x of LABELS) if (S.t >= x[0]) l = x; return { ora: l[1], momento: l[2] }; },
    pick(cx, cy) {
      const r = canvas.getBoundingClientRect();
      v2.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const hits = ray.intersectObject(world.building, true);
      for (const h of hits) {
        if (!h.object.visible || !h.object.userData.part) continue;
        if (S.sectionAmt > 0.5 && h.point.z > clip.constant) continue;
        let o = h.object, vis = true; while (o) { if (!o.visible) vis = false; o = o.parent; }
        if (vis) return h.object.userData.part;
      }
      return null;
    },
    // per generare le immagini della versione leggera
    snapshot(t, w, h, layout = 'right') {
      S.layout = layout; S.t = S.target = t; S.time = 0;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      resize(); for (let i = 0; i < 30; i++) applyState(0.1);
      applyLight(); applyView(); render();
    },
    resize,
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); },
    roof: ROOF,
  };
}
