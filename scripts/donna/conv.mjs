import fs from 'fs';
const [,, inp, voz] = process.argv;
const CH = /^[A-G][#b]?(?:m|M|maj|sus|dim|aug|add|\d|[#b+\-]|\([^)]*\))*(?:\/[A-G][#b]?)?$/;
const clean = x => {
  x = x.replace(/^\(+/, '');
  if ((x.match(/\(/g) || []).length < (x.match(/\)/g) || []).length) x = x.replace(/\)+$/, '');
  return x;
};
const toks = l => l.trim().split(/\s+/).filter(Boolean).map(clean).filter(Boolean);
const isChordLine = l => { const t = toks(l); return t.length > 0 && t.every(x => CH.test(x)); };
const SEC = { 'primeira parte': 'VERSO 1', 'segunda parte': 'VERSO 2', 'terceira parte': 'VERSO 3', 'refrão': 'REFRÃO', 'refrao': 'REFRÃO', 'pré-refrão': 'PRÉ-REFRÃO', 'ponte': 'PONTE', 'intro': 'INTRO', 'interlúdio': 'INTERLÚDIO', 'final': 'FINAL', 'solo': 'SOLO' };
const lines = fs.readFileSync(inp, 'utf8').replace(/​/g, '').replace(/\r/g, '').split('\n');
const out = [];
const last = () => out[out.length - 1];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].replace(/\s+$/, '');
  if (!l.trim()) { if (out.length && last() !== '' && !last().startsWith('[Voz')) out.push(''); continue; }
  const m = l.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (m && !CH.test(m[1])) {
    const name = SEC[m[1].toLowerCase()] || m[1].toUpperCase();
    if (out.length && last() !== '') out.push('');
    out.push('[' + name + ']');
    if (m[2] && isChordLine(m[2])) out.push(toks(m[2]).map(c => '[' + c + ']').join(' '));
    else if (!/INTRO|INTERL|SOLO|FINAL/.test(name)) out.push('[Voz: ' + voz + ']');
    continue;
  }
  if (isChordLine(l)) {
    const next = lines[i + 1] || '';
    if (next.trim() && !isChordLine(next) && !/^\s*\[/.test(next.trim())) {
      const lyric = next.replace(/_+/g, '').replace(/\s+$/, '');
      const pos = [...l.matchAll(/\S+/g)].map(x => ({ c: clean(x[0]), i: x.index })).filter(p => p.c);
      let res = '', prev = 0;
      for (const p of pos) { const k = Math.min(p.i, lyric.length); res += lyric.slice(prev, k) + '[' + p.c + ']'; prev = k; }
      res += lyric.slice(prev);
      out.push(res.trim()); i++; continue;
    }
    out.push(toks(l).map(c => '[' + c + ']').join(' ')); continue;
  }
  out.push(l.trim());
}
console.log(out.join('\n').replace(/\n{3,}/g, '\n\n'));
