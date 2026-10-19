# El.An. Costruzioni Residenziali — sito

Sito statico (Vite + Three.js + Lenis) con l'esperienza 3D "Come nasce una casa".

## Comandi

```bash
npm install
npm run dev       # anteprima locale su http://localhost:5173
npm run build     # sito pronto in dist/
npm run preview   # prova della build
```

## Struttura

- `index.html` — homepage. I capitoli dell'esperienza sono generati da `src/data/content.js` in fase di build.
- `src/data/content.js` — testi delle 12 fasi e stratigrafie degli elementi. `(cap.)` = dato dai capitolati El.An.
- `src/three/` — scena 3D procedurale (nessun modello da scaricare): `building.js` modello e fasi, `scene.js` luce, telecamera, interazioni.
- `src/main.js` — scroll, caricamento differito del 3D, versione leggera, schede, slider prima/dopo.
- `public/frames/` — immagini della versione leggera, generate dalla stessa scena.
- `public/img/` — logo vettoriale e render dei progetti in WebP.
- `brand/` — logo El.An. vettorializzato (completo, marchio, orizzontale).

## Versione leggera

Si attiva da sola senza WebGL, con "riduci movimento", su dispositivi poco potenti o con risparmio dati.
Si può forzare con `?lite` o forzare il 3D con `?3d`.

Per rigenerare le immagini (con `npm run dev` attivo):

```bash
node scripts/render-frames.mjs http://localhost:5173/capture.html public/frames
```

## Immagini dei progetti

```bash
python3 -I scripts/optimize-images.py <cartella-render> public/img/progetti/<progetto>
```

## Pubblicazione

`render.yaml` descrive il sito statico per Render (build `npm ci && npm run build`, cartella `dist`).
