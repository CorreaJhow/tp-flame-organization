// uso: node cdp.mjs <url> [js-expr]  -> abre aba, espera, avalia expr (default: texto do body)
const [url, expr='document.body.innerText', wait='5000'] = process.argv.slice(2);
const t = await (await fetch('http://127.0.0.1:9222/json/new?'+encodeURI(url),{method:'PUT'})).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
await new Promise(r=>setTimeout(r,+wait));
ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:expr,returnByValue:true,awaitPromise:true}}));
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id===1){console.log(m.result?.result?.value ?? JSON.stringify(m)); console.error('TAB',t.id); process.exit(0)}};
