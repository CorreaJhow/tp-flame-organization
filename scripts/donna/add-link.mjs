// uso: node add-link.mjs "<nome da música>" "<url>" "<rótulo>" [Youtube|Spotify|Cifra|PDF|Drive|Outro]
// Anexa um link na versão da música (Biblioteca > música > Anexos & Links > Anexar Link). Precisa do Opera com --remote-debugging-port=9222.
const [,, nome, url, rotulo, tipo = 'Youtube'] = process.argv;
const t = await (await fetch('http://127.0.0.1:9222/json/new?' + encodeURI('https://tp-flame-organization.vercel.app'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
await new Promise(r => setTimeout(r, 7000));
const expr = `(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const d=${JSON.stringify({ nome, url, rotulo, tipo })};
const set=(el,v)=>{const p=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))};
const btn=re=>[...document.querySelectorAll('button')].find(e=>re.test(e.innerText));
[...document.querySelectorAll('button,a')].find(e=>/^\s*Biblioteca\s*\d*\s*$/.test(e.innerText||'')).click();await sl(1500);
const c=[...document.querySelectorAll('div,button')].filter(e=>e.innerText&&e.innerText.includes(d.nome)&&e.innerText.length<120).pop();if(!c)return 'musica nao achada';c.click();await sl(2000);
btn(/Anexos & Links/).click();await sl(800);btn(/Anexar Link/).click();await sl(800);
const f=[...document.querySelectorAll('input,select')].slice(1);set(f[0],d.tipo);set(f[1],d.rotulo);set(f[2],d.url);await sl(400);
[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='Anexar').click();await sl(2500);
return document.body.innerText.includes(d.url)?'ok':'nao confirmou'})()`;
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
await new Promise(r => ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id === 1) { console.log(m.result?.result?.value ?? JSON.stringify(m).slice(0, 300)); r(); } });
await fetch('http://127.0.0.1:9222/json/close/' + t.id); process.exit(0);
