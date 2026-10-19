import { defineConfig } from 'vite';
import { FASI } from './src/data/content.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = (s) => esc(s).replace(/\s*\(cap\.\)/g, ' <abbr class="cap" title="Dato dal capitolato El.An.">cap.</abbr>');

// Scrive i capitoli nell'HTML: testo leggibile anche senza JavaScript e dai motori di ricerca.
function chapters() {
  return FASI.map((f, i) => {
    const last = i === FASI.length - 1;
    return `
        <article class="chapter" id="fase-${f.n}" data-i="${i}" aria-labelledby="fase-${f.n}-t">
          <div class="card">
            <p class="ch-num"><b>${f.n}</b><span>${i === 0 ? 'prima del cantiere' : '/ 11'}</span></p>
            <h2 id="fase-${f.n}-t">${esc(f.titolo)}</h2>
            <p class="ch-sub">${esc(f.sotto)}</p>
            <p class="ch-text">${esc(f.testo)}</p>
            <p class="ch-big"><b>${esc(f.numero[0])}</b>${f.numero[1] ? `<small>${esc(f.numero[1])}</small>` : ''}<span>${esc(f.numero[2])}</span></p>
            <details class="ch-details" open>
              <summary>Tempi, materiali e controlli</summary>
              <dl>
                <div><dt>Tempi indicativi</dt><dd>${esc(f.tempi)}</dd></div>
                <div><dt>Materiali</dt><dd><ul>${f.materiali.map((m) => `<li>${cap(m)}</li>`).join('')}</ul></dd></div>
                <div><dt>Cosa controlliamo</dt><dd><ul>${f.controlli.map((m) => `<li>${cap(m)}</li>`).join('')}</ul></dd></div>
              </dl>
            </details>${last ? `
            <div class="actions"><a class="btn btn-gold" href="#progetti">Scopri i progetti</a><a class="btn btn-ghost" href="#contatti">Parla con noi</a></div>` : ''}
          </div>
        </article>`;
  }).join('') + `
        <p class="chapters-note">Tempi e quantità sono indicativi e si riferiscono alla palazzina d'esempio mostrata nella scena. <abbr class="cap" title="Dato dal capitolato El.An.">cap.</abbr> = dato dai capitolati El.An.</p>`;
}

export default defineConfig({
  plugins: [{ name: 'fasi', transformIndexHtml: (html) => html.replace('<!--FASI-->', chapters()) }],
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900, assetsInlineLimit: 2048 },
  server: { host: true },
});
