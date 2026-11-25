const expr = `(()=>{const u=[...new Set([...document.querySelectorAll('pre b')].map(b=>b.innerText.trim()).filter(Boolean))];const t=document.body.innerText;const basic=[...new Set(u.map(c=>c.split('/')[0].replace(/^([A-G][#b]?m?).*/,'$1')))];return JSON.stringify({t:document.title.slice(0,45),tom:(t.match(/tom:\s*(\S+)/i)||[])[1],basicos:basic,n:basic.length,total:u.length})})()`;
for (const url of process.argv.slice(2)) {
  const t = await (await fetch('http://127.0.0.1:9222/json/new?'+encodeURI(url),{method:'PUT'})).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  await new Promise(r=>setTimeout(r,5500));
  ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:expr,returnByValue:true}}));
  await Promise.race([new Promise(r=>setTimeout(r,8000)),new Promise(r=>ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1){console.log(url.split('.br')[1],m.result?.result?.value??JSON.stringify(m).slice(0,200));r()}})]);
  ws.close(); await fetch('http://127.0.0.1:9222/json/close/'+t.id);
}
process.exit(0);
