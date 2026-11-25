// uso: node repertorio.mjs  -> lê o app (Opera via CDP 9222, já logado), salva docs/repertorio/snapshot.json
// e imprime o resumo: músicas por vezes tocadas, última vez, nunca tocadas, cultos sem repertório.
import { writeFileSync, mkdirSync } from 'node:fs';
const APP = 'https://tp-flame-organization.vercel.app';
const t = await (await fetch('http://127.0.0.1:9222/json/new?' + encodeURI(APP), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
const ev = expr => new Promise(res => {
  const id = Math.floor(Math.random() * 1e9);
  const h = e => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', h); res(m.result?.result?.value); } };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
});
// espera o storage carregar (listeners do Firestore)
let ok = false;
for (let i = 0; i < 20 && !ok; i++) { await new Promise(r => setTimeout(r, 1500)); ok = await ev('!!(window.storage && window.storage.getMusicas().length)'); }
if (!ok) { console.error('storage vazio: confira se o Opera está logado'); process.exit(1); }
const d = JSON.parse(await ev(`JSON.stringify({m:window.storage.getMusicas(),v:window.storage.getVersoes(),c:window.storage.getCultos(),r:window.storage.getRepertorio()})`));
await fetch('http://127.0.0.1:9222/json/close/' + t.id);
const live = a => a.filter(x => !x.Excluido_Em);
const M = live(d.m), V = live(d.v), C = live(d.c), R = live(d.r);
mkdirSync('docs/repertorio', { recursive: true });
writeFileSync('docs/repertorio/snapshot.json', JSON.stringify({ geradoEm: new Date().toISOString(), musicas: M, versoes: V.map(({ Letra, ...v }) => v), cultos: C, repertorio: R }, null, 1));
const vMus = Object.fromEntries(V.map(v => [v.ID, v.ID_Musica]));
const cultoById = Object.fromEntries(C.map(c => [c.ID, c]));
const stat = {};
for (const r of R) {
  const c = cultoById[r.ID_Culto]; const mid = vMus[r.ID_Versao];
  if (!c || !mid || c.Status === 'Cancelado') continue;
  (stat[mid] ??= []).push({ data: c.Data.slice(0, 10), status: c.Status, tom: r.Tom_Culto || V.find(v => v.ID === r.ID_Versao)?.Tom });
}
console.log(`músicas ${M.length} | versões ${V.length} | cultos ${C.length} | itens de repertório ${R.length}`);
const rows = M.map(m => { const u = (stat[m.ID] || []).sort((a, b) => b.data.localeCompare(a.data)); const tom = V.find(v => v.ID_Musica === m.ID)?.Tom; return { n: m.Nome, a: m.Artista, cat: m.Categoria, tom, vezes: u.length, ultima: u[0]?.data || '-' }; });
rows.sort((a, b) => b.vezes - a.vezes || a.n.localeCompare(b.n));
console.log('\nMÚSICA | ARTISTA | CAT | TOM | VEZES | ÚLTIMA');
for (const r of rows) console.log(`${r.n} | ${r.a} | ${r.cat} | ${r.tom} | ${r.vezes} | ${r.ultima}`);
console.log('\nNunca tocadas no app:', rows.filter(r => !r.vezes).length);
console.log('Cultos sem repertório:', C.filter(c => !R.some(r => r.ID_Culto === c.ID)).map(c => c.Data.slice(0, 10)).join(', ') || 'nenhum');
process.exit(0);
